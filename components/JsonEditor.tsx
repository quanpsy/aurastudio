import React, { useState, useEffect } from 'react';
import { Composition } from '../types';

interface JsonEditorProps {
  composition: Composition;
  onUpdate: (newComp: Composition) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ composition, onUpdate }) => {
  const [text, setText] = useState(JSON.stringify(composition, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(composition, null, 2));
  }, [composition]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setError(null);
      // Debounce or wait for blur could be better, but immediate feedback is requested
    } catch (err) {
      setError("Invalid JSON");
    }
  };

  const handleBlur = () => {
    try {
        const parsed = JSON.parse(text);
        onUpdate(parsed);
        setError(null);
    } catch (err) {
        setError("Invalid JSON - Changes not saved");
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-orange-100 font-mono text-xs rounded-lg overflow-hidden shadow-inner">
      <div className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center border-b border-[#3e3e3e]">
        <span className="font-bold text-gray-400">composition.json</span>
        {error && <span className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded">{error}</span>}
        {!error && <span className="text-green-400">Valid</span>}
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        spellCheck={false}
        className="flex-1 bg-transparent p-4 resize-none outline-none selection:bg-orange-500/30"
      />
    </div>
  );
};