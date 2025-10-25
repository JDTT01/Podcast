import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PodcastConfig } from '../types';
import { createAudioUrl } from '../utils/audioUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SuggestionsResponse {
  suggestions: string[];
  aspects: string[];
  tones: string[];
}

export async function generateCoverArt(theme: string, seriesTitle: string): Promise<string[]> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Crea una carátula de podcast minimalista y llamativa. Tema del podcast: "${seriesTitle}". Tema del episodio: "${theme}". Estilo: arte digital, abstracto, colores vibrantes, sin texto.`,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
  } catch (error) {
    console.error("Error generating cover art:", error);
    // Fallback to local image if Gemini fails (e.g., rate limiting)
    console.log("Falling back to local placeholder image 'Podcast.avif'.");
    return [
        '/Podcast.avif',
        '/Podcast.avif',
        '/Podcast.avif',
        '/Podcast.avif',
    ];
  }
}


export async function generateImprovementSuggestions(theme: string, podcastFormat: string): Promise<SuggestionsResponse> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres un productor de podcasts experto y creativo. Para un podcast sobre el tema "${theme}" con el formato de "${podcastFormat}", genera ideas para mejorarlo. Proporciona la respuesta en formato JSON.
      
      Necesito exactamente:
      1. Un array llamado "suggestions" con 12 ideas de contenido breves y atractivas (ej: "Explorar el impacto en la cultura pop", "Entrevistar a un pionero del campo").
      2. Un array llamado "aspects" con 4 "aspectos clave" únicos y relevantes para el tema (ej: "Debate Ético", "Innovación Tecnológica").
      3. Un array llamado "tones" con 4 "tonos" específicos que encajarían bien con el tema (ej: "Conspirativo", "Optimista", "Nostálgico").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "12 ideas de contenido breves y atractivas."
            },
            aspects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 aspectos clave únicos y relevantes."
            },
            tones: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 tonos específicos para el tema."
            },
          },
          required: ["suggestions", "aspects", "tones"],
        },
      },
    });

    const jsonText = response.text;
    return JSON.parse(jsonText) as SuggestionsResponse;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return { suggestions: [], aspects: [], tones: [] };
  }
}

export async function generateScript(config: PodcastConfig): Promise<{ title: string; script: string }> {
  const speakers = ['Joe', 'Jane'];
  const userIdeaPrompt = config.userIdea ? `- Idea Específica del Usuario: ${config.userIdea}\n` : '';

  let formatInstruction = '';
  switch (config.podcastFormat) {
    case 'Entrevista (Jane entrevista a Joe)':
      formatInstruction = `El guion debe ser una entrevista donde Jane es la entrevistadora y Joe es el experto invitado. Jane debe hacer preguntas perspicaces y Joe debe proporcionar respuestas detalladas.`;
      break;
    case 'Monólogo Narrativo (Joe)':
      formatInstruction = `El guion debe ser un monólogo narrativo entregado en su totalidad por Joe. Jane no debe hablar en absoluto. Todas las líneas deben comenzar con "Joe:".`;
      break;
    case 'Debate Estructurado':
      formatInstruction = `El guion debe ser un debate estructurado entre Joe y Jane. Deben presentar argumentos claros, contraargumentos y llegar a una conclusión o resumir sus puntos de vista.`;
      break;
    case 'Conversación Dinámica':
    default:
      formatInstruction = `El guion debe ser una conversación natural y fluida entre ${speakers.join(' y ')}.`;
      break;
  }


  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: `Eres un guionista y productor de podcasts de clase mundial. Crea el contenido para un episodio de podcast basado en la siguiente configuración. La respuesta debe ser un JSON.

    Configuración:
    - Título de la Serie: ${config.seriesTitle}
    - Tema del Episodio: ${config.theme}
    - Formato del Episodio: ${config.podcastFormat}. ${formatInstruction}
    - Duración: ${config.duration}
    - Público Objetivo: ${config.audience}
    - Aspectos Clave a Cubrir: ${config.aspects.join(', ')}
    - Tono General: ${config.tones.join(', ')}
    - Ideas Adicionales a Incorporar: ${config.aiSuggestions.join(', ')}
    ${userIdeaPrompt}- Presentadores: ${speakers.join(' y ')}.

    Instrucciones:
    1. Escribe un título atractivo y conciso para el episodio en un campo llamado "title".
    2. Escribe un guion completo en un campo llamado "script", siguiendo las directrices del formato del episodio.
    3. El guion DEBE comenzar con el nombre de uno de los presentadores seguido de dos puntos (ej: "Joe:").
    4. No incluyas texto introductorio como "Aquí está el guion:". Simplemente el diálogo.
    5. Incorpora los aspectos, tono e ideas de forma orgánica en la conversación.
    6. Ajusta la longitud del guion a la duración especificada.
    7. El guion debe centrarse exclusivamente en el diálogo. No incluyas anotaciones de producción, efectos de sonido o texto entre paréntesis, ya que serán leídos en voz alta.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
        },
        required: ['title', 'script'],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateAudio(script: string, config: PodcastConfig): Promise<string> {
    const speakerConfigs = [
        { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker1 } } },
        { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker2 } } }
    ];

  const audioResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerConfigs
        }
      }
    }
  });

  const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio data.");
  }
  
  const audioUrl = await createAudioUrl(base64Audio);
  return audioUrl;
}