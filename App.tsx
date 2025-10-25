import React, { useState } from 'react';
import PodcastForm from './components/PodcastForm';
import PodcastPlayer from './components/PodcastPlayer';
import LoadingSpinner from './components/LoadingSpinner';
import { PodcastConfig, Podcast } from './types';
import { generateScript, generateAudio } from './services/geminiService';
import { SparklesIcon } from './components/icons/SparklesIcon';

function App() {
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleFormSubmit = async (config: PodcastConfig) => {
    setIsLoading(true);
    try {
      setLoadingMessage('Generando guion y título... (esto puede tardar un poco)');
      const { title, script } = await generateScript(config);
      
      setLoadingMessage('Generando audio del podcast... (esto puede tardar más)');
      const audioUrl = await generateAudio(script, config);

      const coverArtText = config.seriesTitle || config.theme;
      const finalCoverArtUrl = config.coverArtUrl || `https://via.placeholder.com/512/8B5CF6/FFFFFF?text=${encodeURIComponent(coverArtText)}`;
      
      setPodcast({ title, script, audioUrl, coverArtUrl: finalCoverArtUrl });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to generate podcast:', error);
      alert('Hubo un error al generar el podcast. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setPodcast(null);
    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text flex items-center justify-center gap-3">
            <SparklesIcon className="w-8 h-8" />
            <span>Podcast Studio AI</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Genera episodios de podcast únicos sobre cualquier tema con IA.
          </p>
        </header>

        <main>
          {isLoading ? (
            <LoadingSpinner message={loadingMessage} />
          ) : podcast ? (
            <PodcastPlayer podcast={podcast} onReset={handleReset} />
          ) : (
            <PodcastForm onSubmit={handleFormSubmit} />
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Creado con la API de Google Gemini.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;