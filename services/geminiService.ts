import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Composition, InstrumentType, Track } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const noteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    pitch: { type: Type.STRING, description: "Musical pitch like C4, F#3" },
    startTime: { type: Type.NUMBER, description: "Start time 0.0 to 1.0" },
    duration: { type: Type.NUMBER, description: "Duration relative to beat" },
    velocity: { type: Type.NUMBER, description: "Volume 0.0 to 1.0" }
  },
  required: ["pitch", "startTime", "duration", "velocity"]
};

const snippetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    instrument: { type: Type.STRING, enum: Object.values(InstrumentType) },
    notes: { 
      type: Type.ARRAY, 
      items: noteSchema 
    },
    color: { type: Type.STRING },
    mathPattern: { type: Type.STRING, description: "Math concept used e.g. Golden Ratio" },
    complexity: { type: Type.NUMBER }
  },
  required: ["name", "instrument", "notes", "mathPattern"]
};

const trackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    snippets: { type: Type.ARRAY, items: snippetSchema },
    volume: { type: Type.NUMBER },
    muted: { type: Type.BOOLEAN }
  },
  required: ["name", "snippets"]
};

const compositionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    bpm: { type: Type.INTEGER },
    scale: { type: Type.STRING },
    timeSignature: { type: Type.STRING },
    globalPitchShift: { type: Type.INTEGER, description: "Pitch shift in semitones (0 is default)"},
    tracks: { type: Type.ARRAY, items: trackSchema },
    lyrics: { type: Type.STRING, description: "Lyrics for the song" }
  },
  required: ["title", "bpm", "scale", "tracks"]
};

export const generateInitialComposition = async (prompt: string): Promise<Composition | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a musical composition JSON structure based on this request: "${prompt}". 
      Use mathematical patterns like Golden Ratio, Fibonacci, or Euclidean rhythms for note placement.
      Create 3 tracks (Drums, Bass, Melody). Each track should have 1 snippet.
      Ensure snippets have at least 4-8 notes.
      If the user implies vocals or a song, generate poetic lyrics in the 'lyrics' field.
      Default globalPitchShift to 0.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: compositionSchema,
        systemInstruction: "You are an expert music theorist and mathematician composer."
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Composition;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};

export const refineSnippetWithAI = async (currentSnippet: any, instruction: string): Promise<any | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Original Snippet JSON: ${JSON.stringify(currentSnippet)}. 
      User Instruction: "${instruction}".
      Return a modified version of the snippet JSON observing the instruction. Maintain the ID.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: snippetSchema
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    return null;
  }
};

export const generateLyrics = async (currentLyrics: string, theme: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Lyrics: "${currentLyrics}".
      Theme/Instruction: "${theme}".
      Write or continue the lyrics. Focus on imagery, rhythm, and emotion. Return ONLY the lyrics text.`,
      config: {
        responseMimeType: "text/plain",
        systemInstruction: "You are a poetic songwriter."
      }
    });

    return response.text || null;
  } catch (error) {
    console.error("Gemini Lyric Generation Error:", error);
    return null;
  }
};

export const chatWithMusicAI = async (currentComposition: Composition, userMessage: string): Promise<{message: string, updatedComposition?: Composition}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Current Music JSON: ${JSON.stringify(currentComposition)}
        User Request: "${userMessage}"
        
        Analyze the request.
        1. If the user wants to change the music (add tracks, change notes, change BPM, etc.), return the MODIFIED JSON in the variable 'updatedComposition'.
        2. If the user just wants to chat or ask a question, return 'updatedComposition' as null.
        3. Always provide a conversational 'message' explaining what you did or answering the question.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             message: { type: Type.STRING },
             updatedComposition: compositionSchema
          },
          required: ["message"]
        },
        systemInstruction: "You are an AI music studio assistant. You can edit the music JSON directly based on user requests."
      }
    });

    const text = response.text;
    if (!text) return { message: "I encountered an error processing that." };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { message: "Sorry, I couldn't process your request." };
  }
};