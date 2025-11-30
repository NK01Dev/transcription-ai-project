import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult, Message } from "../types";

export const gradeSession = async (messages: Message[], language: string): Promise<GradingResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert messages to a readable transcript string
  const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

  const prompt = `
    Analyze the following language interview transcript in ${language}. 
    The interviewer is the 'MODEL' and the student is the 'USER'.
    
    Transcript:
    ${transcript}
    
    Task:
    1. Determine the CEFR proficiency level (A1, A2, B1, B2, C1, C2).
    2. Assign a score from 0 to 100 based on fluency, grammar, vocabulary, and pronunciation (inferred from text flow).
    3. List key strengths.
    4. List key weaknesses or areas for improvement.
    5. Provide a short paragraph of constructive feedback.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cefrLevel: { type: Type.STRING },
            score: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            feedback: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as GradingResult;
  } catch (error) {
    console.error("Grading failed:", error);
    return {
      cefrLevel: "N/A",
      score: 0,
      strengths: ["Could not analyze"],
      weaknesses: ["Please try again"],
      feedback: "An error occurred during analysis."
    };
  }
};