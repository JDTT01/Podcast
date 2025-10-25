export interface PodcastConfig {
  theme: string;
  seriesTitle: string;
  speaker1: string; // voice name
  speaker2: string; // voice name
  duration: string;
  aspects: string[];
  tones: string[];
  audience: string;
  aiSuggestions: string[];
  coverArtUrl: string;
  userIdea: string;
  podcastFormat: string;
}

export interface Podcast {
  title: string;
  audioUrl: string;
  script: string;
  coverArtUrl: string;
}

export const voices = [
    { id: 'Kore', name: 'Kore (Voz Femenina, Clara)' },
    { id: 'Puck', name: 'Puck (Voz Masculina, Amistosa)' },
    { id: 'Zephyr', name: 'Zephyr (Voz Femenina, Calmada)' },
    { id: 'Charon', name: 'Charon (Voz Masculina, Profunda)' },
    { id: 'Fenrir', name: 'Fenrir (Voz Masculina, Energética)' },
];

export const podcastFormats = [
  'Conversación Dinámica',
  'Entrevista (Jane entrevista a Joe)',
  'Monólogo Narrativo (Joe)',
  'Debate Estructurado'
];
