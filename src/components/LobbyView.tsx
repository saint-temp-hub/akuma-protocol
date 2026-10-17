import React, { useState } from 'react';
import type { GameState, GameMode, Team } from '../game/types.ts';
import { RulesGuideModal } from './RulesGuideModal.tsx';
import { ExitRoomModal } from './ExitRoomModal.tsx';

interface LobbyViewProps {
  state: GameState;
  currentUserId: string;
  isHost: boolean;
  onSelectSlot: (slot: number, team: Team) => void;
  onToggleGameMode: (mode: GameMode) => void;
  onStartMatch: () => void;
  onQuickFillBots: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  state,
  currentUserId,
  isHost,
  onSelectSlot,
  onToggleGameMode,
  onStartMatch,
  onQuickFillBots,
  onLeaveRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?room=${state.room}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const slots = [
    { slot: 0, team: 'A' as Team, title: 'TEAM A · PLAYER 1', color: 'text-red-400', border: 'border-red-900/60' },
    { slot: 1, team: 'B' as Team, title: 'TEAM B · PLAYER 1', color: 'text-cyan-400', border: 'border-cyan-900/60' },
    { slot: 2, team: 'A' as Team, title: 'TEAM A · PLAYER 2', color: 'text-red-400', border: 'border-red-900/60' },
    { slot: 3, team: 'B' as Team, title: 'TEAM B · PLAYER 2', color: 'text-cyan-400', border: 'border-cyan-900/60' },
  ];

  const playersInRoom = state.players;
  const isFull = playersInRoom.length === 4;

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 font-mono">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl mb-4 bg-black">
        <div className="h-32 sm:h-40 w-full relative">
          <img
            src="/src/assets/images/akuma_banner_art_1792175812552.jpg"
            alt="Akuma Deduction Arena"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent"></div>
        </div>

        <div className="p-4 sm:p-5 relative -mt-10">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              GAME LOBBY
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsRulesOpen(true)}
                className="text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer transition-colors"
              >
                📜 How to Play
              </button>
              <button
                type="button"
                onClick={() => setIsExitModalOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-800/80 cursor-pointer font-bold transition-colors"
              >
                🚪 Exit Room
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">
              ROOM CODE
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-3xl sm:text-4xl font-black tracking-widest text-amber-400 font-mono drop-shadow-md">
                {state.room}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs px-3 py-1.5 rounded-lg border border-neutral-700 cursor-pointer flex items-center space-x-1 shadow-sm transition-colors"
              >
                <span>{copiedLink ? '✓ LINK COPIED' : '📋 SHARE INVITE'}</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 max-w-md">
              Share the room code or link with 3 friends to play 2v2 across devices!
            </p>
          </div>

          {/* Quick Rules Hint for Beginners */}
          <div className="mt-3 p-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-left text-xs text-neutral-300">
            <div className="font-bold text-amber-300 mb-0.5">Quick Guide for New Players:</div>
            <div className="text-[11px] text-neutral-400 leading-relaxed">
              1 secret Target Card is sealed in the vault. 5 suits (♠ Spades, ♥ Hearts, ♦ Diamonds, ♣ Clubs, 👿 Demon) with 3 cards each. Discard cards to reveal suits — when all 3 of a suit are seen, it is ruled out! First team to deduce the target suit wins!
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold">GAME MODE:</span>
            {isHost ? (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onToggleGameMode('NORMAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    state.gameMode === 'NORMAL'
                      ? 'bg-neutral-200 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => onToggleGameMode('AKUMA')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    state.gameMode === 'AKUMA'
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  AKUMA (WITH POWERS)
                </button>
              </div>
            ) : (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                  state.gameMode === 'AKUMA'
                    ? 'bg-amber-400 text-black'
                    : 'bg-neutral-800 text-neutral-200'
                }`}
              >
                {state.gameMode === 'AKUMA' ? 'AKUMA (POWERS ENABLED)' : 'NORMAL'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4 Player Seats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>PLAYER SEATS (ROTATION: A1 → B1 → A2 → B2)</span>
          <span className="font-bold text-amber-400">{playersInRoom.length} / 4 READY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {slots.map((s) => {
            const occupant = playersInRoom.find((p) => p.slot === s.slot);
            const isSelf = occupant?.id === currentUserId;

            return (
              <div
                key={s.slot}
                className={`p-3 rounded-xl border ${s.border} bg-[#141414] flex flex-col justify-between min-h-24 shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold mb-1">
                    <span className={s.color}>{s.title}</span>
                    <span>SEAT {s.slot + 1}</span>
                  </div>

                  {occupant ? (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            s.team === 'A' ? 'bg-red-500' : 'bg-cyan-400'
                          }`}
                        ></div>
                        <span className="font-bold text-neutral-200 text-sm">
                          {occupant.name} {isSelf && '(You)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold">
                        Rating: {occupant.rating}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-neutral-500 italic">
                      Empty seat
                    </div>
                  )}
                </div>

                {!occupant && (
                  <button
                    type="button"
                    onClick={() => onSelectSlot(s.slot, s.team)}
                    className="mt-2 py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 cursor-pointer text-center transition-colors"
                  >
                    Take Seat
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      <div className="space-y-2.5">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={onStartMatch}
              disabled={!isFull}
              className={`w-full py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-widest border transition-all ${
                isFull
                  ? 'bg-amber-400 text-black border-amber-300 hover:bg-amber-300 cursor-pointer shadow-lg'
                  : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
              }`}
            >
              {isFull
                ? 'START MATCH (4 PLAYERS READY)'
                : `WAITING FOR PLAYERS (${playersInRoom.length} / 4)`}
            </button>

            {!isFull && (
              <button
                type="button"
                onClick={onQuickFillBots}
                className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                🤖 Quick Fill Remaining Seats with Bots (Test Mode)
              </button>
            )}
          </>
        ) : (
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xs text-neutral-400">
            Waiting for room host to start the match...
          </div>
        )}
      </div>

      {/* Rules Guide Modal */}
      <RulesGuideModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Exit Room Modal */}
      <ExitRoomModal
        isOpen={isExitModalOpen}
        roomId={state.room}
        onConfirm={() => {
          setIsExitModalOpen(false);
          onLeaveRoom();
        }}
        onCancel={() => setIsExitModalOpen(false)}
      />
    </div>
  );
};
