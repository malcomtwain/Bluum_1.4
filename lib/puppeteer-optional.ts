/**
 * Puppeteer optionnel pour les environnements de production
 * Puppeteer est utilisé pour générer des images de texte pour les hooks
 * Si non disponible, on utilise une solution alternative
 */

let puppeteer: any = null;

// Essayer de charger Puppeteer seulement si disponible
try {
  if (typeof window === 'undefined') {
    puppeteer = require('puppeteer');
  }
} catch (error) {
  console.warn('Puppeteer not available, hook overlays will be disabled');
}

export function isPuppeteerAvailable(): boolean {
  return puppeteer !== null;
}

export function getPuppeteer(): any {
  if (!puppeteer) {
    throw new Error('Puppeteer is not available in this environment');
  }
  return puppeteer;
}

export async function generateTextImage(
  text: string,
  width: number = 1080,
  height: number = 1920
): Promise<Buffer | null> {
  if (!puppeteer) {
    console.warn('Cannot generate text image: Puppeteer not available');
    return null;
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important pour Render
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    
    // Créer une image avec le texte
    await page.setContent(`
      <html>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;background:transparent;">
          <h1 style="font-size:60px;color:white;text-shadow:2px 2px 4px rgba(0,0,0,0.5);">
            ${text}
          </h1>
        </body>
      </html>
    `);
    
    const screenshot = await page.screenshot({ 
      omitBackground: true,
      type: 'png'
    });
    
    await browser.close();
    return screenshot as Buffer;
  } catch (error) {
    console.error('Error generating text image:', error);
    return null;
  }
}