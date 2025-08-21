'use client';

export default function VideoProcessingInfo() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-red-500">
          ⚠️ Traitement Vidéo Non Disponible sur Vercel
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pourquoi ?</h2>
          <p className="text-gray-300 mb-4">
            Vercel utilise des fonctions serverless qui ne permettent pas l'exécution de FFmpeg,
            le logiciel nécessaire pour traiter les vidéos.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Solutions Recommandées</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">1. Migrer vers Railway.app</h3>
              <p className="text-gray-300 mb-2">
                Railway supporte nativement FFmpeg et offre un déploiement simple depuis GitHub.
              </p>
              <a 
                href="https://railway.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Déployer sur Railway →
              </a>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">2. Utiliser Cloudinary API</h3>
              <p className="text-gray-300 mb-2">
                Cloudinary offre une API puissante pour le traitement vidéo.
                Configuration requise dans .env :
              </p>
              <code className="block bg-gray-900 p-2 rounded mt-2">
                CLOUDINARY_API_KEY=your_key<br/>
                CLOUDINARY_API_SECRET=your_secret
              </code>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">3. Autres Plateformes</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Render.com (tier gratuit disponible)</li>
                <li>• Fly.io (excellent pour le traitement vidéo)</li>
                <li>• DigitalOcean App Platform</li>
                <li>• AWS Lambda avec FFmpeg Layer</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Migration Facile</h2>
          <p className="text-gray-300 mb-4">
            Pour migrer vers Railway :
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Créez un compte sur Railway.app</li>
            <li>Connectez votre repo GitHub</li>
            <li>Railway détectera automatiquement Next.js</li>
            <li>Ajoutez vos variables d'environnement</li>
            <li>Déployez - FFmpeg fonctionnera automatiquement</li>
          </ol>
        </div>
      </div>
    </div>
  );
}