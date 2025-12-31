import React, { useState, useEffect, useCallback } from 'react';
import { Composition, InstrumentType, Track, Snippet, ChatMessage, HistoryItem } from './types';
import { generateInitialComposition, chatWithMusicAI } from './services/geminiService';
import { MathPanel } from './components/MathPanel';
import { SnippetEditor } from './components/SnippetEditor';
import { LyricsPanel } from './components/LyricsPanel';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { JsonEditor } from './components/JsonEditor';
import { ChatInterface } from './components/ChatInterface';
import { INSTRUMENT_COLORS } from './constants';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [composition, setComposition] = useState<Composition | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [selectedSnippet, setSelectedSnippet] = useState<{trackId: string, snippet: Snippet} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // UI State
  const [leftTab, setLeftTab] = useState<'sequencer' | 'code'>('sequencer');
  const [rightTab, setRightTab] = useState<'chat' | 'lyrics' | 'math'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pitchShift, setPitchShift] = useState(0);

  // --- History Management ---
  const pushToHistory = useCallback((newComp: Composition, description: string) => {
    const newItem: HistoryItem = { timestamp: Date.now(), description, state: newComp };
    // If we are in the middle of history and make a change, we truncate the future
    const newHistory = [...history.slice(0, historyIndex + 1), newItem];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const restoreHistory = (index: number) => {
    if (index >= 0 && index < history.length) {
      setComposition(history[index].state);
      setPitchShift(history[index].state.globalPitchShift || 0);
      setHistoryIndex(index);
    }
  };

  // --- Actions ---

  const handleGlobalPitchChange = (semitones: number) => {
    setPitchShift(semitones);
    audioEngine.setGlobalPitchShift(semitones);
    if(composition) {
        // We update state loosely here, ideally debounced
        const updated = { ...composition, globalPitchShift: semitones };
        setComposition(updated);
    }
  };

  const handleUpdateComposition = (newComp: Composition, desc: string = "Manual Edit") => {
    setComposition(newComp);
    pushToHistory(newComp, desc);
    if (newComp.globalPitchShift !== undefined) {
        setPitchShift(newComp.globalPitchShift);
        audioEngine.setGlobalPitchShift(newComp.globalPitchShift);
    }
  };

  const handleInitialGenerate = async (prompt: string) => {
    setIsAiLoading(true);
    const comp = await generateInitialComposition(prompt);
    setIsAiLoading(false);
    
    if (comp) {
      setComposition(comp);
      setChatMessages([{ role: 'model', text: `I've composed "${comp.title}" for you. What do you think?`, timestamp: Date.now() }]);
      pushToHistory(comp, "Initial Generation");
      setPitchShift(comp.globalPitchShift || 0);
    }
  };

  const handleChat = async (text: string) => {
    if (!composition) {
        // If no composition, treat as initial prompt
        handleInitialGenerate(text);
        return;
    }

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', text, timestamp: Date.now() }];
    setChatMessages(newMessages);
    setIsAiLoading(true);

    const result = await chatWithMusicAI(composition, text);
    setIsAiLoading(false);

    setChatMessages(prev => [...prev, { role: 'model', text: result.message, timestamp: Date.now() }]);

    if (result.updatedComposition) {
        handleUpdateComposition(result.updatedComposition, "AI Update via Chat");
    }
  };

  // --- Sequencer Loop ---
  useEffect(() => {
    let interval: number;
    if (isPlaying && composition) {
       const playLoop = () => {
         composition.tracks.forEach(track => {
           if(!track.muted && track.snippets.length > 0) {
             audioEngine.playSnippet(track.snippets[0].notes, track.snippets[0].instrument, composition.bpm);
           }
         });
       };
       playLoop();
       const loopTime = (240 / composition.bpm) * 1000; 
       interval = window.setInterval(playLoop, loopTime);
    }
    return () => clearInterval(interval);
  }, [isPlaying, composition]);


  return (
    <div className="h-screen bg-cream-50 text-cream-900 font-sans flex flex-col overflow-hidden">
      
      {/* 1. Header (Global Controls) */}
      <nav className="h-14 bg-white border-b border-orange-100 flex items-center justify-between px-4 z-50 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
             <span className="font-bold text-lg tracking-tight text-orange-900">Aura<span className="font-light text-orange-600">Studio</span></span>
          </div>

          {/* Transport */}
          <div className="flex items-center gap-2 bg-cream-100 rounded-full px-2 py-1 border border-orange-100 ml-4">
             <button 
               onClick={() => setIsPlaying(!isPlaying)}
               className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isPlaying ? 'bg-orange-500 text-white' : 'hover:bg-orange-200 text-orange-700'}`}
             >
                {isPlaying ? (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                )}
             </button>
             {composition && <span className="text-xs font-mono font-bold text-orange-800 px-2">{composition.bpm} BPM</span>}
          </div>

          {/* Pitch Control */}
          <div className="flex items-center gap-2 ml-4">
             <span className="text-xs font-bold text-orange-400 uppercase">Pitch</span>
             <input 
               type="range" min="-12" max="12" step="1" 
               value={pitchShift} 
               onChange={(e) => handleGlobalPitchChange(parseInt(e.target.value))}
               className="w-24 h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
             />
             <span className="text-xs font-mono w-6 text-right">{pitchShift > 0 ? `+${pitchShift}` : pitchShift}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* History Dropdown */}
           <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                 Version: {historyIndex + 1}/{history.length}
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-orange-100 hidden group-hover:block z-50 p-2 max-h-80 overflow-y-auto">
                 {history.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => restoreHistory(idx)}
                      className={`p-2 rounded text-xs cursor-pointer flex justify-between ${idx === historyIndex ? 'bg-orange-100 text-orange-900 font-bold' : 'hover:bg-cream-50 text-gray-600'}`}
                    >
                       <span>{item.description}</span>
                       <span className="opacity-50">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </nav>

      {/* 2. Main Workspace (3-Pane Layout) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Canvas/Code (60%) */}
        <div className="flex-[1.5] flex flex-col border-r border-orange-200 bg-cream-50 relative z-10">
           {/* Pane Tabs */}
           <div className="h-10 bg-white border-b border-orange-200 flex items-center px-4 gap-4">
              <button 
                onClick={() => setLeftTab('sequencer')}
                className={`text-xs font-bold uppercase tracking-wider h-full border-b-2 px-2 transition ${leftTab === 'sequencer' ? 'border-orange-500 text-orange-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Sequencer
              </button>
              <button 
                onClick={() => setLeftTab('code')}
                className={`text-xs font-bold uppercase tracking-wider h-full border-b-2 px-2 transition ${leftTab === 'code' ? 'border-orange-500 text-orange-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                JSON Code
              </button>
           </div>

           {/* Content Area */}
           <div className="flex-1 overflow-hidden relative">
              {leftTab === 'sequencer' ? (
                 <div className="h-full flex flex-col">
                    {/* Tracks */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                        {!composition && (
                           <div className="h-full flex flex-col items-center justify-center text-orange-300 gap-4">
                              <p>Start by chatting with the assistant on the right.</p>
                           </div>
                        )}
                        {composition?.tracks.map((track) => (
                           <div key={track.id} className="flex h-24 rounded-lg overflow-hidden border border-orange-100 shadow-sm bg-white hover:shadow-md transition">
                              <div className="w-32 bg-cream-100 border-r border-orange-100 p-3 flex flex-col justify-center">
                                 <div className="font-bold text-orange-900 text-sm truncate">{track.name}</div>
                              </div>
                              <div className="flex-1 relative bg-white p-2">
                                  {track.snippets.map((snippet) => (
                                     <div 
                                       key={snippet.id}
                                       onClick={() => setSelectedSnippet({ trackId: track.id, snippet })}
                                       className={`
                                         cursor-pointer h-full w-1/4 rounded border border-white/20 shadow-sm relative overflow-hidden
                                         ${INSTRUMENT_COLORS[snippet.instrument as InstrumentType]} hover:brightness-110 transition
                                       `}
                                     >
                                        <div className="p-2 text-white text-xs font-bold">{snippet.name}</div>
                                     </div>
                                  ))}
                              </div>
                           </div>
                        ))}
                    </div>
                    {/* Bottom Visualizer Overlay */}
                    <div className="h-32 bg-white border-t border-orange-100 p-4">
                        <SpectrumAnalyzer />
                    </div>
                 </div>
              ) : (
                 <div className="h-full p-4 bg-[#1e1e1e]">
                    {composition && <JsonEditor composition={composition} onUpdate={(c) => handleUpdateComposition(c, "Code Edit")} />}
                 </div>
              )}
           </div>
        </div>

        {/* Right Pane: Assistant (40%) */}
        <div className="flex-1 flex flex-col bg-white min-w-[350px]">
           {/* Pane Tabs */}
           <div className="h-10 bg-cream-50 border-b border-orange-100 flex items-center px-4 gap-1">
              {['chat', 'lyrics', 'math'].map((tab) => (
                 <button 
                   key={tab}
                   onClick={() => setRightTab(tab as any)}
                   className={`
                     flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition
                     ${rightTab === tab ? 'bg-white shadow-sm text-orange-700' : 'text-orange-900/40 hover:text-orange-600'}
                   `}
                 >
                   {tab}
                 </button>
              ))}
           </div>

           <div className="flex-1 overflow-hidden relative">
              {rightTab === 'chat' && (
                 <ChatInterface 
                    messages={chatMessages} 
                    onSendMessage={handleChat} 
                    isLoading={isAiLoading} 
                 />
              )}
              {rightTab === 'lyrics' && (
                 <div className="h-full p-4">
                   <LyricsPanel 
                      lyrics={composition?.lyrics || ""} 
                      onLyricsChange={(l) => composition && handleUpdateComposition({...composition, lyrics: l}, "Lyrics Update")}
                      title={composition?.title || ""}
                   />
                 </div>
              )}
              {rightTab === 'math' && (
                 <div className="h-full p-4 bg-cream-50">
                    <MathPanel bpm={composition?.bpm || 120} />
                 </div>
              )}
           </div>
        </div>

      </div>

      {/* Snippet Editor Modal */}
      {selectedSnippet && (
        <SnippetEditor 
          snippet={selectedSnippet.snippet} 
          bpm={composition?.bpm || 120}
          onClose={() => setSelectedSnippet(null)}
          onUpdate={(updated) => {
             if(composition) {
               const newTracks = composition.tracks.map(t => {
                  if (t.id === selectedSnippet.trackId) {
                    return { ...t, snippets: t.snippets.map(s => s.id === updated.id ? updated : s) };
                  }
                  return t;
                });
                handleUpdateComposition({ ...composition, tracks: newTracks }, `Edited ${updated.name}`);
             }
             setSelectedSnippet(null);
          }}
        />
      )}
    </div>
  );
}