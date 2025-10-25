import React, { useState, useCallback } from 'react';
import { PodcastConfig, voices, podcastFormats } from '../types';
import { generateImprovementSuggestions, SuggestionsResponse, generateCoverArt } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { SettingsIcon } from './icons/SettingsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ImageIcon } from './icons/ImageIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { AudioWaveIcon } from './icons/AudioWaveIcon';

interface PodcastFormProps {
  onSubmit: (config: PodcastConfig) => void;
}

const steps = [
  { id: 1, name: 'Idea', icon: MicrophoneIcon },
  { id: 2, name: 'Personalización', icon: SettingsIcon },
  { id: 3, name: 'Branding', icon: ImageIcon },
  { id: 4, name: 'Producción', icon: AudioWaveIcon },
];

const PodcastForm: React.FC<PodcastFormProps> = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [coverArtOptions, setCoverArtOptions] = useState<string[]>([]);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);

  const [config, setConfig] = useState<Omit<PodcastConfig, 'theme'>>({
    seriesTitle: '',
    speaker1: 'Kore',
    speaker2: 'Puck',
    duration: '5 minutos',
    aspects: [],
    tones: [],
    audience: 'Público general',
    aiSuggestions: [],
    coverArtUrl: '',
    userIdea: '',
    podcastFormat: 'Conversación Dinámica',
  });

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value);
  };

  const fetchSuggestions = useCallback(async () => {
    if (theme.trim().length < 5) {
      alert('Por favor, introduce un tema más descriptivo (mínimo 5 caracteres).');
      return;
    }
    setIsSuggesting(true);
    const result = await generateImprovementSuggestions(theme, config.podcastFormat);
    setSuggestions(result);
    setConfig(prev => ({
      ...prev,
      seriesTitle: prev.seriesTitle || theme,
      aspects: result.aspects.slice(0, 2),
      tones: result.tones.slice(0, 2),
    }));
    setIsSuggesting(false);
    setStep(2);
  }, [theme, config.podcastFormat]);
  
  const handleGenerateArt = async () => {
    if (!config.seriesTitle) {
      alert('Por favor, introduce un nombre para la serie de podcast.');
      return;
    }
    setIsGeneratingArt(true);
    setCoverArtOptions([]);
    const art = await generateCoverArt(theme, config.seriesTitle);
    setCoverArtOptions(art);
    if (art.length > 0) {
      setConfig(prev => ({ ...prev, coverArtUrl: art[0] }));
    }
    setIsGeneratingArt(false);
  };

  const generateArtInBackground = async () => {
    if (!config.seriesTitle) {
      console.warn("No se puede generar la carátula en segundo plano sin un título de serie.");
      return;
    }
    setIsGeneratingArt(true);
    const art = await generateCoverArt(theme, config.seriesTitle);
    setCoverArtOptions(art);
    if (art.length > 0) {
      const randomIndex = Math.floor(Math.random() * art.length);
      setConfig(prev => ({ ...prev, coverArtUrl: art[randomIndex] }));
    }
    setIsGeneratingArt(false);
  };

  const handleToggleSelection = (category: 'aspects' | 'tones' | 'aiSuggestions', value: string) => {
    setConfig(prev => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ theme, ...config });
  };
  
  const nextStep = () => {
    if (step === 3) {
      if (coverArtOptions.length === 0 && !isGeneratingArt && config.seriesTitle) {
        generateArtInBackground();
      }
    }
    setStep(s => Math.min(s + 1, 4));
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isNextDisabled =
    (step === 1 && !suggestions) ||
    (step === 2 && (config.aspects.length === 0 || config.tones.length === 0));

  const renderSelectableGrid = (title: string, items: string[], selectedItems: string[], category: 'aspects' | 'tones' | 'aiSuggestions') => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-300">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => handleToggleSelection(category, item)}
            className={`p-3 text-sm rounded-lg transition-all duration-200 border-2 text-left flex items-start gap-2 ${
              selectedItems.includes(item)
                ? 'bg-purple-500 border-purple-400 text-white shadow-lg'
                : 'bg-gray-700 border-gray-600 hover:border-purple-500 hover:bg-gray-600'
            }`}
          >
            <div className="w-5 h-5 mt-0.5 flex-shrink-0">
              {selectedItems.includes(item) && <CheckIcon className="w-5 h-5" />}
            </div>
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
      {/* Stepper */}
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
          {steps.map((s, index) => (
            <li key={s.name} className="md:flex-1">
              <div
                className={`group flex flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${
                  step > s.id ? 'border-purple-600' : step === s.id ? 'border-purple-600' : 'border-gray-600'
                }`}
              >
                <span className={`text-sm font-medium transition-colors ${
                  step > s.id ? 'text-purple-400' : step === s.id ? 'text-purple-400' : 'text-gray-400'
                }`}>Paso {s.id}</span>
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <div className="pt-6 border-t border-gray-700">
        {/* Step 1: Idea */}
        {step === 1 && (
            <div>
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Paso 1: Define el Corazón de tu Episodio</h2>
                <div className="mb-6">
                    <label htmlFor="theme" className="block text-lg font-semibold mb-2 text-gray-300">
                        ¿Sobre qué tema quieres crear un podcast?
                    </label>
                    <input
                        id="theme"
                        type="text"
                        value={theme}
                        onChange={handleThemeChange}
                        placeholder="Ej: El futuro de la inteligencia artificial"
                        className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                    />
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-300">¿Qué formato tendrá el episodio?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {podcastFormats.map(format => (
                            <button
                                type="button"
                                key={format}
                                onClick={() => setConfig(p => ({...p, podcastFormat: format}))}
                                className={`p-4 text-sm rounded-lg transition-all duration-200 border-2 text-center font-medium ${
                                    config.podcastFormat === format
                                    ? 'bg-purple-500 border-purple-400 text-white shadow-lg'
                                    : 'bg-gray-700 border-gray-600 hover:border-purple-500 hover:bg-gray-600'
                                }`}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={fetchSuggestions}
                        disabled={isSuggesting || theme.trim().length < 5}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isSuggesting ? <LoadingSpinner message=''/> : <SparklesIcon className="w-5 h-5"/>}
                        <span>{isSuggesting ? 'Buscando ideas...' : 'Obtener Sugerencias IA'}</span>
                    </button>
                </div>
                 {isSuggesting && <p className="text-center mt-4 text-gray-400">Analizando el tema y generando ideas creativas...</p>}
            </div>
        )}

        {/* Step 2: Customization */}
        {step === 2 && suggestions && (
            <div>
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Paso 2: Refina el Contenido con la IA</h2>
                {renderSelectableGrid("Aspectos Clave a Cubrir", suggestions.aspects, config.aspects, 'aspects')}
                {renderSelectableGrid("Tono General", suggestions.tones, config.tones, 'tones')}
                {renderSelectableGrid("Ideas Adicionales a Incorporar (opcional)", suggestions.suggestions, config.aiSuggestions, 'aiSuggestions')}
                
                <div className="mt-6">
                  <label htmlFor="userIdea" className="block text-lg font-semibold mb-3 text-gray-300">
                    ¿Tienes una idea específica? (Opcional)
                  </label>
                  <textarea
                    id="userIdea"
                    value={config.userIdea}
                    onChange={e => setConfig(p => ({ ...p, userIdea: e.target.value }))}
                    placeholder="Ej: Compara la IA con el cerebro humano y discute las implicaciones éticas."
                    className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                    rows={3}
                  />
                </div>
            </div>
        )}

        {/* Step 3: Branding */}
        {step === 3 && (
            <div>
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Paso 3: Crea la Identidad Visual</h2>
                 <div className="mb-6">
                    <label htmlFor="seriesTitle" className="block text-sm font-medium mb-2 text-gray-300">Nombre de la Serie de Podcast</label>
                    <input id="seriesTitle" type="text" value={config.seriesTitle} onChange={e => setConfig(p => ({...p, seriesTitle: e.target.value}))} placeholder="Ej: Mentes Digitales" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <button
                    type="button"
                    onClick={handleGenerateArt}
                    disabled={isGeneratingArt || !config.seriesTitle}
                    className="w-full bg-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-700 disabled:bg-gray-500 flex items-center justify-center gap-2 transition-colors"
                >
                    <SparklesIcon className="w-5 h-5"/>
                    {isGeneratingArt ? 'Creando magia...' : 'Generar 4 Opciones de Carátula'}
                </button>

                {isGeneratingArt && <div className="text-center py-4"><LoadingSpinner message="Diseñando tu carátula..." /></div>}

                {coverArtOptions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-300">Elige tu carátula favorita</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {coverArtOptions.map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt={`Opción de carátula ${index + 1}`}
                                    onClick={() => setConfig(prev => ({...prev, coverArtUrl: src}))}
                                    className={`w-full rounded-lg cursor-pointer transition-all duration-200 aspect-square object-cover ${config.coverArtUrl === src ? 'ring-4 ring-purple-500 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Step 4: Production */}
        {step === 4 && (
            <div>
                <h2 className="text-2xl font-bold text-purple-300 mb-4">Paso 4: Ajusta los Detalles Finales</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium mb-2 text-gray-300">Duración Aprox.</label>
                        <select id="duration" value={config.duration} onChange={e => setConfig(p => ({...p, duration: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500">
                            <option>2 minutos</option>
                            <option>5 minutos</option>
                            <option>10 minutos</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="audience" className="block text-sm font-medium mb-2 text-gray-300">Público Objetivo</label>
                        <input id="audience" type="text" value={config.audience} onChange={e => setConfig(p => ({...p, audience: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="speaker1" className="block text-sm font-medium mb-2 text-gray-300">Presentador 1 (Joe)</label>
                        <select id="speaker1" value={config.speaker1} onChange={e => setConfig(p => ({...p, speaker1: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500">
                            {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="speaker2" className="block text-sm font-medium mb-2 text-gray-300">Presentador 2 (Jane)</label>
                        <select id="speaker2" value={config.speaker2} onChange={e => setConfig(p => ({...p, speaker2: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500">
                            {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        )}

      </div>
      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-700">
          <button
              type="button"
              onClick={prevStep}
              className={`bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              disabled={step === 1}
          >
              Anterior
          </button>

          <button
              type="submit"
              onClick={(e) => {
                  if (step < 4) {
                      e.preventDefault();
                      nextStep();
                  }
              }}
              className={`font-bold py-3 px-6 rounded-lg transition-colors ${
                  step === 4
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white text-lg hover:opacity-90'
                      : isNextDisabled
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              disabled={step < 4 && isNextDisabled}
          >
              {step < 4 ? 'Siguiente' : 'Generar Podcast'}
          </button>
      </div>
    </form>
  );
};

export default PodcastForm;