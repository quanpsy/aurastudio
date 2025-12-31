import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-orange-300 mt-10 text-sm">
            <p>I am your studio assistant.</p>
            <p>Ask me to change instruments, add notes, or explain the theory.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-orange-100 text-orange-900 rounded-tr-none' 
                  : 'bg-cream-100 text-gray-800 rounded-tl-none border border-orange-100'}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-cream-50 px-4 py-2 rounded-2xl rounded-tl-none border border-orange-50 flex gap-1">
               <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce delay-150"></span>
             </div>
           </div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 border-t border-orange-100 bg-cream-50/50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe changes or ask a question..."
            className="flex-1 bg-white border border-orange-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-orange-900 placeholder-orange-300 shadow-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl transition shadow-md disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};