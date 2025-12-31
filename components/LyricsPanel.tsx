import React, { useState, useEffect } from 'react';
import { generateLyrics } from '../services/geminiService';

interface LyricsPanelProps {
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  title: string;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ lyrics, onLyricsChange, title }) => {
  const [localLyrics, setLocalLyrics] = useState(lyrics);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setLocalLyrics(lyrics);
  }, [lyrics]);

  const handleBlur = () => {
    onLyricsChange(localLyrics);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !localLyrics.trim()) return;
    setIsGenerating(true);
    const result = await generateLyrics(localLyrics, prompt || "Continue these lyrics with a matching flow");
    setIsGenerating(false);
    
    if (result) {
      const separator = localLyrics ? "\n\n" : "";
      const newLyrics = localLyrics + separator + result.trim();
      setLocalLyrics(newLyrics);
      onLyricsChange(newLyrics);
      setPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden relative">
       {/* Paper Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ea580c' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

      <div className="p-4 border-b border-orange-100 bg-cream-50/50 flex justify-between items-center z-10">
        <h2 className="text-orange-900 font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 001.06 1.06l1.72-1.72v5.69a.75.75 0 001.5 0v-5.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
          </svg>
          Lyrics
        </h2>
        <span className="text-xs text-orange-400 font-mono italic">{title || "Untitled"}</span>
      </div>

      <div className="flex-1 relative z-10">
        <textarea 
          value={localLyrics}
          onChange={(e) => setLocalLyrics(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full p-6 resize-none outline-none text-gray-800 font-serif text-lg leading-relaxed bg-transparent selection:bg-orange-100 placeholder-gray-300"
          placeholder="Write your lyrics here... The ink of inspiration never dries."
        />
      </div>

      <div className="p-3 bg-cream-50 border-t border-orange-100 z-10">
        <div className="flex gap-2">
           <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Suggest a verse about..." 
              className="flex-1 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-orange-900 placeholder-orange-300"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50 shadow-sm"
            >
              {isGenerating ? (
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a2.63 2.63 0 00-.729 1.621 3 3 0 11-4.243-4.243 2.63 2.63 0 001.621-.729l4.679-8.421A3 3 0 0115.75 4.5zM12 10.125a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z" clipRule="evenodd" />
                  <path d="M16.75 17.25a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243z" />
                </svg>
              )}
              Inspire
            </button>
        </div>
      </div>
    </div>
  );
};