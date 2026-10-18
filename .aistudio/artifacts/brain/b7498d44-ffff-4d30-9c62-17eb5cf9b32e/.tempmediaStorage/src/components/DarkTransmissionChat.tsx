import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Team } from '../game/types.ts';

interface DarkTransmissionChatProps {
  isOpen: boolean;
  commsHistory: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  userTeam: Team;
  onSendMessage: (text: string) => void;
}

export const DarkTransmissionChat: React.FC<DarkTransmissionChatProps> = ({
  isOpen,
  commsHistory,
  currentUserId,
  currentUserName,
  userTeam,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commsHistory, isOpen, isMinimized]);

  if (!isOpen) {
    return null;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const teamColor = userTeam === 'A' ? 'text-red-400' : 'text-cyan-400';

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 bg-neutral-950 border border-emerald-500/80 px-3.5 py-2 rounded-xl text-emerald-400 font-mono text-xs shadow-xl animate-pulse cursor-pointer hover:bg-neutral-900 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="font-bold">DARK TRANSMISSION (EXPAND)</span>
          <span className="text-[10px] text-emerald-600">[{commsHistory.length}]</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 sm:right-6 sm:bottom-6 sm:left-auto sm:w-96 z-40 bg-neutral-950/95 border-2 border-emerald-500/80 rounded-2xl p-3.5 sm:p-4 shadow-2xl font-mono text-emerald-400 backdrop-blur-md">
      {/* Header (No X button! It auto-ends on turn end) */}
      <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60 mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-black tracking-wider uppercase text-emerald-300">
            DARK TRANSMISSION (TEAM {userTeam} ONLY)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="text-emerald-500 hover:text-emerald-300 text-xs px-2 py-0.5 border border-emerald-800 rounded-md cursor-pointer transition-colors"
          title="Minimize window"
        >
          _ Minimize
        </button>
      </div>

      <div className="text-[10px] text-emerald-600/90 mb-2 flex items-center justify-between">
        <span>Private Team Channel</span>
        <span className="text-amber-400 font-semibold">Ends automatically on turn end</span>
      </div>

      {/* Message Stream */}
      <div className="h-44 sm:h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-xs">
        {commsHistory.length === 0 ? (
          <div className="text-emerald-700/80 italic py-8 text-center text-xs">
            Secret channel open with your teammate. Whisper your strategy before your turn ends!
          </div>
        ) : (
          commsHistory.map((msg) => {
            const isSelf = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`p-2 rounded-lg ${
                  isSelf
                    ? 'bg-emerald-950/50 border-l-3 border-emerald-400 ml-4'
                    : 'bg-neutral-900/80 border-l-3 border-emerald-600 mr-4'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-80 mb-0.5">
                  <span className={`${teamColor} font-bold`}>
                    {msg.senderName} {isSelf && '(You)'}
                  </span>
                  <span className="text-neutral-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-emerald-200 font-sans break-words text-xs leading-relaxed">
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="mt-2.5 flex space-x-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Whisper to teammate..."
          maxLength={120}
          className="flex-1 bg-black border border-emerald-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 placeholder-emerald-800 focus:outline-none focus:border-emerald-400 font-mono"
        />
        <button
          type="submit"
          className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer transition-colors shadow-sm"
        >
          SEND
        </button>
      </form>
    </div>
  );
};
