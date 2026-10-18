import React, { useEffect } from 'react';
import type { GameState, Card, GameMode } from '../game/types.ts';
import { CardView } from './CardView.tsx';
import { soundEffects } from '../utils/soundEffects.ts';

interface RoundOverModalProps {
  state: GameState;
  targetCard: Card | null;
  isHost: boolean;
  onPlayNextRound: () => void;
  onEqualizeAndRebalance: () => void;
  onToggleGameMode: (mode: GameMode) => void;
}

export const RoundOverModal: React.FC<RoundOverModalProps> = ({
  state,
  targetCard,
  isHost,
  onPlayNextRound,
  onEqualizeAndRebalance,
  onToggleGameMode,
}) => {
  useEffect(() => {
    if (state.phase === 'ROUND_OVER') {
      soundEffects.playVictoryFanfare();
    }
  }, [state.phase]);

  if (state.phase !== 'ROUND_OVER') {
    return null;
  }

  const winningTeam = state.winnerTeam;
  const teamTheme = winningTeam === 'A' ? 'text-red-500' : 'text-cyan-400';
  const borderTheme = winningTeam === 'A' ? 'border-red-600' : 'border-cyan-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono">
      <div
        className={`w-full max-w-lg bg-[#141414] border-2 ${borderTheme} rounded-2xl p-5 sm:p-6 shadow-2xl my-auto relative overflow-hidden`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 blur-2xl pointer-events-none rounded-full"></div>

        {/* Banner */}
        <div className="text-center pb-4 border-b border-neutral-800 relative">
          <div className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-1">
            ROUND {state.roundNumber} COMPLETE
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${teamTheme}`}>
            TEAM {winningTeam} WINS!
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Target Suit: <span className="font-bold text-white uppercase">{targetCard?.suit}</span>
          </p>
        </div>

        {/* Revealed Target Card */}
        <div className="flex flex-col items-center justify-center my-4 py-3 bg-neutral-950/80 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mb-2">
            SECRET TARGET CARD
          </span>
          <div className="transform scale-105 drop-shadow-xl">
            <CardView card={targetCard} masked={false} size="md" />
          </div>
        </div>

        {/* Individual Score & Rating */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              PLAYER RATINGS & PERFORMANCE
            </span>
            <span className="text-[9px] text-neutral-500">
              Rating = (Pts × 0.7) + (Prev × 0.3)
            </span>
          </div>

          <div className="space-y-1.5">
            {[...state.players]
              .sort((a, b) => b.rating - a.rating)
              .map((p, idx) => {
                const teamBadgeColor =
                  p.team === 'A'
                    ? 'bg-red-950/80 text-red-300 border-red-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-neutral-500 w-4">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-neutral-200">{p.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${teamBadgeColor}`}>
                        Team {p.team}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <span
                          className={`font-mono font-bold ${
                            p.roundPoints >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {p.roundPoints > 0 ? `+${p.roundPoints}` : p.roundPoints} pts
                        </span>
                        <span className="text-[9px] text-neutral-500 block">Round</span>
                      </div>
                      <div className="pl-2 border-l border-neutral-800 min-w-14">
                        <span className="font-mono font-bold text-amber-400">{p.rating}</span>
                        <span className="text-[9px] text-neutral-500 block">Rating</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Game Mode Selector for Host */}
        {isHost && (
          <div className="mb-4 p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">NEXT ROUND MODE:</span>
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
                AKUMA (POWERS)
              </button>
            </div>
          </div>
        )}

        {/* Buttons for Host */}
        <div className="space-y-2 mt-4">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={onEqualizeAndRebalance}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-widest rounded-xl border border-amber-300 shadow-md cursor-pointer transition-colors"
              >
                ⚡ EQUALIZE & REBALANCE TEAMS (RANK 1+4 vs 2+3)
              </button>
              <button
                type="button"
                onClick={onPlayNextRound}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-neutral-700 cursor-pointer transition-colors"
              >
                PLAY NEXT ROUND (KEEP CURRENT TEAMS)
              </button>
            </>
          ) : (
            <div className="text-center py-2 text-xs text-neutral-500">
              Waiting for Room Host to start the next round...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
