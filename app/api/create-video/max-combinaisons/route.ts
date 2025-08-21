import { NextResponse } from 'next/server';
import { updateProgress } from '@/lib/progress';
import { getFFmpegPath, getFFprobePath } from '@/lib/ffmpeg-config';

// Lazy require Node APIs only on the server
let pathModule: any = null;
let fsPromises: any = null;
let fs: any = null;
let childProcess: any = null;
let util: any = null;
let nodeFetch: any = null;

if (typeof window === 'undefined') {
  try {
    pathModule = require('path');
    fsPromises = require('fs/promises');
    fs = require('fs');
    childProcess = require('child_process');
    util = require('util');
    import('node-fetch').then((m) => (nodeFetch = m.default));
    
  } catch (error) {
    console.error('Max Combinaisons: native imports failed:', error);
  }
}

const join = (...args: any[]) => (pathModule ? pathModule.join(...args) : '');
const existsSync = (p: string) => (fs ? fs.existsSync(p) : false);
const writeFileSync = (p: string, d: any) => (fs ? fs.writeFileSync(p, d) : null);
const readFile = async (p: string) => (fsPromises ? fsPromises.readFile(p) : Buffer.from(''));
const mkdir = async (p: string, o?: any) => (fsPromises ? fsPromises.mkdir(p, o) : null);
const exec = childProcess ? childProcess.exec : () => {};
const execPromise = util ? util.promisify(exec) : async () => ({ stdout: '', stderr: '' });

export const runtime = 'nodejs';

async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}

function isImageFile(filePath: string): boolean {
  const ext = pathModule ? pathModule.extname(filePath).toLowerCase() : '';
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
}

type PartInput = { url: string; type: 'image' | 'video' };

type RequestBody = {
  hook?: { text?: string; style?: number; position?: 'top' | 'middle' | 'bottom'; offset?: number };
  parts: PartInput[]; // Array of 10 parts in order
  song: { url: string };
  logo?: {
    url: string;
    size: number; // Size in percentage (5-30)
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  } | null; // Logo data with settings (optional)
  mode: 'max-combinaisons';
};

export async function POST(req: Request) {
  try {
    const data: RequestBody = await req.json();

    if (data.mode !== 'max-combinaisons') {
      return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
    }

    const parts = data.parts;

    if (!parts || !Array.isArray(parts) || parts.length !== 10) {
      return NextResponse.json({ success: false, error: 'Max Combinaisons requires exactly 10 parts' }, { status: 400 });
    }

    const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : join(process.cwd(), 'temp');
    const tempOutputDir = process.env.NODE_ENV === 'production' ? '/tmp' : join(process.cwd(), 'public', 'temp-videos');
    await ensureDirectoryExists(tempDir);
    await ensureDirectoryExists(tempOutputDir);

    const timestamp = Date.now();
    const outputFileName = `max_combinaisons_${timestamp}.mp4`;
    const outputPath = join(tempOutputDir, outputFileName);

    // Helpers
    async function saveUrlToFile(urlStr: string, prefix: string): Promise<string> {
      if (urlStr.startsWith('data:')) {
        const partsSplit = urlStr.split('base64,');
        if (partsSplit.length < 2) throw new Error('Invalid data URL');
        const before = partsSplit[0];
        const base64Data = partsSplit[1];
        const mimeType = before.split(':')[1]?.split(';')[0] || '';
        let ext = '.mp4';
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
        else if (mimeType.includes('webp')) ext = '.webp';
        else if (mimeType.includes('gif')) ext = '.gif';
        else if (mimeType.includes('image')) ext = '.jpg';
        const buf = Buffer.from(base64Data, 'base64');
        const p = join(tempDir, `${prefix}_${timestamp}${ext}`);
        writeFileSync(p, buf);
        return p;
      }
      if (urlStr.startsWith('http')) {
        const res = await nodeFetch(urlStr);
        const contentType = res.headers.get('content-type') || '';
        let ext = '.mp4';
        if (contentType.includes('image/png')) ext = '.png';
        else if (contentType.includes('image/jpeg')) ext = '.jpg';
        else if (contentType.includes('image/webp')) ext = '.webp';
        else if (contentType.includes('image/gif')) ext = '.gif';
        const buf = await res.buffer();
        const p = join(tempDir, `${prefix}_${timestamp}${ext}`);
        writeFileSync(p, buf);
        return p;
      }
      if (urlStr.startsWith('/')) {
        return join(process.cwd(), 'public', urlStr.slice(1));
      }
      return urlStr;
    }

    // Save inputs and build scaled segments for all 10 parts
    const scaledPaths: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const src = await saveUrlToFile(p.url, `max_part${i + 1}`);
      const isImg = isImageFile(src);
      const duration = p.type === 'image' ? 2.5 : undefined;
      const scaled = join(tempDir, `max_part${i + 1}_scaled_${timestamp}.mp4`);
      const targetWidth = 1080;
      const targetHeight = 1920;
      let cmd = '';
      const ffmpegPath = getFFmpegPath();
      if (isImg || p.type === 'image') {
        cmd = `${ffmpegPath} -loop 1 -i "${src}" -t ${duration ?? 3} -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 "${scaled}"`;
      } else {
        cmd = `${ffmpegPath} -i "${src}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},setsar=1" -c:v libx264 -pix_fmt yuv420p -r 30 "${scaled}"`;
      }
      await execPromise(cmd);
      scaledPaths.push(scaled);
    }

    updateProgress(30);

    // Calculer la durée totale des clips
    let totalVideoDuration = 0;
    for (const clipPath of scaledPaths) {
      try {
        const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "${clipPath}" | cat`);
        const duration = parseFloat((stdout || '').trim());
        if (isFinite(duration)) {
          totalVideoDuration += duration;
        }
      } catch (error) {
        console.warn(`Could not get duration for ${clipPath}:`, error);
        // Si on ne peut pas obtenir la durée, on estime 3 secondes par clip
        totalVideoDuration += 3;
      }
    }

    console.log(`Total video duration: ${totalVideoDuration.toFixed(2)}s`);

    // Concaténer toutes les parties
    const inputs = scaledPaths.map((p) => `-i "${p}"`).join(' ');
    const n = scaledPaths.length;

    // Gérer l'audio de la musique - la durée totale est celle des clips vidéo
    const songPath = await saveUrlToFile(data.song.url, 'song');

    const concatInputs = scaledPaths.map((_, idx) => `[${idx}:v]`).join('');
    const ffmpegPath = getFFmpegPath();
    let finalCmd = `${ffmpegPath} ${inputs} -i "${songPath}" -filter_complex "${concatInputs}concat=n=${n}:v=1:a=0[outv];[${n}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,atrim=0:${totalVideoDuration.toFixed(3)},asetpts=PTS-STARTPTS[outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -t ${totalVideoDuration.toFixed(3)} "${outputPath}"`;

    updateProgress(60);
    await execPromise(finalCmd);

    // Overlay du logo si présent (avant le hook)
    if (data.logo) {
      const logoPath = await saveUrlToFile(data.logo.url, 'logo');
      const videoWithLogoPath = join(tempDir, `video_with_logo_${timestamp}.mp4`);
      
      // Calculer la taille du logo basée sur le pourcentage
      const logoWidth = Math.round(1080 * (data.logo.size / 100));
      
      // Calculer la position du logo
      let overlayPosition = '';
      const margin = 20;
      switch (data.logo.position) {
        case 'top-left':
          overlayPosition = `${margin}:${margin}`;
          break;
        case 'top-right':
          overlayPosition = `W-w-${margin}:${margin}`;
          break;
        case 'bottom-left':
          overlayPosition = `${margin}:H-h-${margin}`;
          break;
        case 'bottom-right':
          overlayPosition = `W-w-${margin}:H-h-${margin}`;
          break;
        case 'center':
          overlayPosition = '(W-w)/2:(H-h)/2';
          break;
        default:
          overlayPosition = `W-w-${margin}:${margin}`; // Default to top-right
      }
      
      // Appliquer le logo avec la taille et la position configurées
      const ffmpegPath = getFFmpegPath();
      const logoCmd = `${ffmpegPath} -i "${outputPath}" -i "${logoPath}" -filter_complex "[1:v]scale=${logoWidth}:-1[logo];[0:v][logo]overlay=${overlayPosition}:format=auto,format=yuv420p[outv]" -map "[outv]" -map 0:a -c:v libx264 -c:a copy "${videoWithLogoPath}"`;
      await execPromise(logoCmd);
      await execPromise(`mv "${videoWithLogoPath}" "${outputPath}"`);
    }

    // Overlay du hook si présent
    if (data.hook?.text) {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

      const hookImagePath = join(tempDir, `hook_${timestamp}.png`);
      const position = data.hook.position || 'top';
      const offset = data.hook.offset || 0;
      const style = data.hook.style || 2;

      const normalStyle = `font-size: 60px; line-height: 1.2; display: inline-block; width: 100%; max-width: 80%; margin: 0 auto; text-align: center; color: #fff; font-weight: normal; text-shadow: -2.8px -2.8px 0 #000, 2.8px -2.8px 0 #000, -2.8px 2.8px 0 #000, 2.8px 2.8px 0 #000; padding: 0.8rem 1.5rem 1rem 1.5rem; background: transparent; filter: none;`;
      const backgroundWhiteStyle = `font-size: 65px; line-height: 1.2; display: inline; box-decoration-break: clone; background: #fff; padding: 0.1rem 1.5rem 0.75rem 1.5rem; filter: url('#goo'); max-width: 80%; text-align: center; color: #000; font-weight: normal;`;
      const backgroundBlackStyle = `font-size: 65px; line-height: 1.2; display: inline; box-decoration-break: clone; background: #000; padding: 0.1rem 1.5rem 0.75rem 1.5rem; filter: url('#goo'); max-width: 80%; text-align: center; color: #fff; font-weight: normal;`;

      const html = `
        <html><head><style>
        @font-face { font-family: 'TikTok Display Medium'; src: url('${join(process.cwd(), 'public/fonts/TikTokDisplayMedium.otf')}'); }
        body { margin:0; width:1080px; height:1920px; display:flex; align-items:${position === 'top' ? 'flex-start' : position === 'middle' ? 'center' : 'flex-end'}; justify-content:center; padding:${position === 'top' ? '250px' : position === 'bottom' ? '200px' : '0px'} 0; font-family:'TikTok Display Medium', sans-serif; }
        .goo { ${style === 1 ? normalStyle : style === 2 ? backgroundWhiteStyle : backgroundBlackStyle} transform: translateY(${offset * 8}px); }
        </style></head><body><h1 style="width:85%;text-align:center;margin:0;padding:0"><div class="goo">${data.hook.text}</div></h1>
        <svg style="visibility:hidden;position:absolute" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1"><defs><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs></svg>
        </body></html>`;

      await page.setContent(html);
      await page.screenshot({ path: hookImagePath, omitBackground: true, type: 'png' });
      await browser.close();

      const videoWithHookPath = join(process.cwd(), 'public', 'generated', `video_with_hook_${timestamp}.mp4`);
      let yPos = '0';
      if (position === 'middle') yPos = '(H-h)/2';
      else if (position === 'bottom') yPos = 'H-h-0';
      const scaleFactor = style === 1 ? '1.15' : '1';
      const ffmpegPath = getFFmpegPath();
      const overlayCmd = `${ffmpegPath} -i "${outputPath}" -i "${hookImagePath}" -filter_complex "[1:v]scale=iw*${scaleFactor}:-1[overlay];[0:v][overlay]overlay=(W-w)/2:${yPos}:format=auto,format=yuv420p[outv]" -map "[outv]" -map 0:a -c:v libx264 -c:a copy "${videoWithHookPath}"`;
      await execPromise(overlayCmd);
      await execPromise(`mv "${videoWithHookPath}" "${outputPath}"`);
    }

    updateProgress(100);

    const expirationTime = Date.now() + 15 * 60 * 1000;
    try {
      const metaFilePath = join(tempOutputDir, `${outputFileName}.meta.json`);
      await fsPromises.writeFile(metaFilePath, JSON.stringify({ expires: expirationTime, created: Date.now() }));
    } catch {}

    const videoPath = process.env.NODE_ENV === 'production' 
      ? `/api/video/${outputFileName}` 
      : `/temp-videos/${outputFileName}`;
    
    return NextResponse.json({ success: true, videoPath, expiresAt: expirationTime });
  } catch (error) {
    console.error('Max Combinaisons route error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}