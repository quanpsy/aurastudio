import React, { useState } from 'react';
import { Snippet, Note, InstrumentType } from '../types';
import { audioEngine } from '../services/audioEngine';
import { refineSnippetWithAI } from '../services/geminiService';

interface SnippetEditorProps {
  snippet: Snippet;
  bpm: number;
  onClose: () => void;
  onUpdate: (updatedSnippet: Snippet) => void;
}

export const SnippetEditor: React.FC<SnippetEditorProps> = ({ snippet, bpm, onClose, onUpdate }) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSnippet, setLocalSnippet] = useState<Snippet>(snippet);

  const handleAIDirective = async () => {
    if (!instruction.trim()) return;
    setIsProcessing(true);
    const result = await refineSnippetWithAI(localSnippet, instruction);
    setIsProcessing(false);
    if (result) {
      setLocalSnippet(result);
    }
  };

  const handlePlayPreview = () => {
    audioEngine.playSnippet(localSnippet.notes, localSnippet.instrument, bpm);
  };

  const handleNoteChange = (idx: number, field: keyof Note, value: number) => {
    const updatedNotes = [...localSnippet.notes];
    updatedNotes[idx] = { ...updatedNotes[idx], [field]: value };
    setLocalSnippet({ ...localSnippet, notes: updatedNotes });
  };

  const handleSave = () => {
    onUpdate(localSnippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-cream-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-cream-50 w-full max-w-2xl rounded-2xl shadow-2xl border border-orange-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-orange-900">{localSnippet.name}</h2>
            <p className="text-orange-500 text-sm font-mono uppercase tracking-widest">{localSnippet.mathPattern}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePlayPreview} className="bg-orange-100 hover:bg-orange-200 text-orange-700 p-2 rounded-full transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* AI Control */}
        <div className="p-6 bg-orange-50/50 border-b border-orange-100">
            <label className="block text-xs font-bold text-orange-800 uppercase mb-2">AI Refinement</label>
            <div className="flex gap-2">
                <input 
                  type="text" 
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., 'Make it more syncopated using Euclidean spacing'" 
                  className="flex-1 border-orange-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none text-orange-900 placeholder-orange-300 bg-white"
                />
                <button 
                  onClick={handleAIDirective}
                  disabled={isProcessing}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
                    </svg>
                  )}
                  Iterate
                </button>
            </div>
        </div>

        {/* Note Grid (Visual Only for now) */}
        <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-bold text-orange-900 mb-4">Manual Micro-Edits</h3>
            <div className="grid grid-cols-1 gap-2">
                {localSnippet.notes.map((note, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white p-2 rounded border border-orange-100 hover:border-orange-300 transition group">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          {note.pitch}
                        </div>
                        <div className="flex-1">
                            <input 
                              type="range" 
                              min="0" max="1" step="0.01" 
                              value={note.velocity} 
                              onChange={(e) => handleNoteChange(i, 'velocity', parseFloat(e.target.value))}
                              className="w-full h-1 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-[10px] text-orange-400 mt-1">
                              <span>Velocity</span>
                              <span>{(note.velocity * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                         <div className="flex-1">
                            <input 
                              type="range" 
                              min="0" max="1" step="0.01" 
                              value={note.startTime} 
                              onChange={(e) => handleNoteChange(i, 'startTime', parseFloat(e.target.value))}
                              className="w-full h-1 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                             <div className="flex justify-between text-[10px] text-orange-400 mt-1">
                              <span>Timing</span>
                              <span>{note.startTime.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-orange-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-orange-700 font-medium hover:bg-orange-50 rounded-lg transition">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-200 transition">Save Changes</button>
        </div>
      </div>
    </div>
  );
};