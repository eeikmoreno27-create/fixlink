
import { GoogleGenAI, Type } from "@google/genai";
import { DrumSpecs } from "../types";

export const getTuningExpertAdvice = async (specs: DrumSpecs) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Actúa como un Ingeniero de Audio y Drum Tech de élite especializado en percusión acústica. 
  Configuración: ${specs.type} ${specs.brand} modelo ${specs.model} (${specs.material}), ${specs.diameter}" de diámetro con ${specs.lugs} lugs.
  Género Musical: ${specs.genre}.
  Estrategia de Relación: ${specs.strategy} (UNISON = igual tensión, RESO_HIGHER = resonante más agudo, BATTER_HIGHER = golpe más agudo).
  Parches: Golpe (${specs.batterBrand} ${specs.batterModel}), Resonante (${specs.resonantBrand} ${specs.resonantModel}).
  
  Consideraciones Técnicas Especiales:
  - Si el modelo es "M Series" de Mapex, considera que son cascos de Abedul (Birch) o híbridos Arce/Abedul, conocidos por su ataque rápido y brillo.
  - El género musical ${specs.genre} define la tensión ideal para el estilo (ej: Norteño requiere tarolas muy 'secas' y agudas, Cumbia requiere toms melódicos).
  
  Dame frecuencias fundamentales (Hz) exactas para cada parche para lograr la mejor resonancia del casco.
  Responde ÚNICAMENTE en JSON con este formato:
  {
    "recommendedHzBatter": number,
    "recommendedHzReso": number,
    "noteName": "string",
    "explanation": "string",
    "tips": ["string", "string"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedHzBatter: { type: Type.NUMBER },
            recommendedHzReso: { type: Type.NUMBER },
            noteName: { type: Type.STRING },
            explanation: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["recommendedHzBatter", "recommendedHzReso", "noteName", "explanation", "tips"]
        }
      }
    });

    const resultText = response.text || '{}';
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini tuning error:", error);
    return null;
  }
};
