import React, { useRef, useEffect } from 'react';
import { Podcast } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface PodcastPlayerProps {
  podcast: Podcast;
  onReset: () => void;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ podcast, onReset }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(error => console.error("Audio autoplay failed:", error));
    }
  }, [podcast.audioUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = podcast.audioUrl;
    const fileName = `${podcast.title.replace(/\s+/g, '_')}.wav`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        <div className="md:w-1/3 flex-shrink-0">
          <img src={podcast.coverArtUrl} alt={`Carátula de ${podcast.title}`} className="w-full h-auto rounded-lg shadow-lg aspect-square object-cover" />
        </div>
        <div className="flex-grow">
          <h2 className="text-3xl font-bold mb-4 text-purple-300">{podcast.title}</h2>
          <div className="mb-6">
            <audio ref={audioRef} controls className="w-full">
              <source src={podcast.audioUrl} type="audio/wav" />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-300">Guion del Episodio</h3>
        <div className="bg-gray-900 p-4 rounded-lg max-h-80 overflow-y-auto text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {podcast.script}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Crear un Nuevo Podcast
        </button>
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <DownloadIcon className="w-5 h-5" />
          Descargar Audio
        </button>
      </div>
    </div>
  );
};

export default PodcastPlayer;