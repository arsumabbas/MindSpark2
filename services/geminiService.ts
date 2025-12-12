import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.API_KEY || ''; // Must be provided in environment
const ai = new GoogleGenAI({ apiKey });

export const generateFlashcards = async (content: string, count: number = 5): Promise<Array<{front: string, back: string}>> => {
  if (!apiKey) {
    throw new Error('API Key is missing. Please check your environment configuration.');
  }

  const prompt = `
    You are an expert tutor. Create ${count} high-quality flashcards from the provided text.
    The cards should follow the "minimum information principle" - simple, atomic questions.
    Return ONLY a JSON array.
    Text: "${content.substring(0, 10000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "Question or front of card" },
              back: { type: Type.STRING, description: "Answer or back of card" }
            },
            required: ['front', 'back']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from AI");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
