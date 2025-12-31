
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserPreferences, Exercise, LANGUAGES } from "./types";

// Verificación de API KEY para evitar cuelgues silenciosos
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Fix: Added missing encodeBase64 for Live API audio streaming
export const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeBase64 = (base64: string): Uint8Array => {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array();
  }
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const generateExercises = async (prefs: UserPreferences): Promise<Exercise[]> => {
  try {
    const ai = getAI();
    const targetLang = LANGUAGES.find(l => l.code === prefs.targetLanguage)?.name || 'Inglés';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como Linguix de ERIK ZAVALA. Genera 5 ejercicios de ${targetLang} nivel ${prefs.subLevel}/1000. Meta: ${prefs.goal}. REGLA: Explicación empieza con "Estás mal, se dice..." en español.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "type", "question", "correctAnswer", "options", "explanation"]
          }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (e) {
    console.error("Linguix AI Error:", e);
    return [];
  }
};

export const speakText = async (text: string, langCode: string): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const lang = LANGUAGES.find(l => l.code === langCode);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: lang?.voice || 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData)?.inlineData?.data;
  } catch (e) {
    return undefined;
  }
};

export const getGeminiLiveSession = (prefs: UserPreferences, callbacks: any) => {
  const ai = getAI();
  const targetLang = LANGUAGES.find(l => l.code === prefs.targetLanguage)?.name || 'Inglés';
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `Eres Linguix de ERIK ZAVALA. Tutor de ${targetLang}. Si el usuario falla, di en ESPAÑOL: "Estás mal, se dice...".`,
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  });
};

export const generateScenario = async (prefs: UserPreferences): Promise<any> => {
  try {
    const ai = getAI();
    const targetLang = LANGUAGES.find(l => l.code === prefs.targetLanguage)?.name || 'Inglés';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crea una misión Linguix para ${prefs.goal} en ${targetLang}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            context: { type: Type.STRING },
            goal: { type: Type.STRING },
            initialAI: { type: Type.STRING }
          },
          required: ["title", "context", "goal", "initialAI"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (e) {
    return null;
  }
};

export const getScenarioResponse = async (history: any[], prefs: UserPreferences): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: history,
      config: {
        systemInstruction: `Tutor Linguix. Si hay errores, usa: "Estás mal, se dice..." en español.`
      }
    });
    return response.text;
  } catch (e) {
    return undefined;
  }
};

export const generateGameContent = async (prefs: UserPreferences): Promise<{ word: string, translation: string }[]> => {
  try {
    const ai = getAI();
    const targetLang = LANGUAGES.find(l => l.code === prefs.targetLanguage)?.name || 'Inglés';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `10 palabras Linguix nivel ${prefs.subLevel} para ${targetLang}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING }
            },
            required: ["word", "translation"]
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (e) {
    return [];
  }
};
