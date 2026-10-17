import React, { useState } from 'react';
import type { GameState, Card } from '../game/types.ts';
import { SUITS } from '../game/types.ts';

interface DeductionTrackerProps {
  state: GameState;
  myHand: Card[];
  isOpen: boolean;
  onClose: () => void;
}

export const DeductionTracker: React.FC<DeductionTrackerProps> = ({
  state,
  myHand,
  isOpen,
  onClose,
}) => {
  const [userNotes, setUserNotes] = useState<Record<string, 'SUSPECT' | 'SAFE' | 'NONE'>>({});

  if (!isOpen) return null;

  const toggleNote = (suit: string) => {
    setUserNotes((prev) => {
      const current = prev[suit] || 'NONE';
      const next = current === 'NONE' ? 'SUSPECT' : current === 'SUSPECT' ? 'SAFE' : 'NONE';
      return { ...prev, [suit]: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl font-mono text-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 text-sm font-bold tracking-widest uppercase">
              DEDUCTION MATRIX
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
              3 CARDS / SUIT
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Strategic briefing */}
        <div className="my-3 p-2.5 bg-black/60 border border-neutral-800 rounded-lg text-xs leading-relaxed text-neutral-400">
          <span className="text-amber-400 font-bold block mb-1">DEDUCTION PRINCIPLE:</span>
          There are exactly <strong className="text-white">3 cards per suit</strong> (15 total). If all 3 cards of a suit are visible across your hand and the cemetery, that suit <strong className="text-red-400">cannot</strong> be the secret Target Card!
        </div>

        {/* 5 Suits Matrix */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {SUITS.map((item) => {
            const inHandCount = myHand.filter((c) => c.suit === item.suit).length;
            const inCemeteryCount = state.cemetery.filter((c) => c.suit === item.suit).length;
            const totalSeen = inHandCount + inCemeteryCount;
            const isDeactivated = state.deactivatedSuits.includes(item.suit);
            const isImpossible = totalSeen >= 3 || isDeactivated;
            const note = userNotes[item.suit] || 'NONE';

            return (
              <div
                key={item.suit}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                  isImpossible
                    ? 'bg-neutral-950/60 border-neutral-900 opacity-60'
                    : note === 'SUSPECT'
                    ? 'bg-amber-950/30 border-amber-500/70 shadow-md'
                    : 'bg-[#181818] border-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl w-8 text-center text-white">{item.symbol}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-neutral-100">
                        {item.name}
                      </span>
                      {isDeactivated && (
                        <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                          ELIMINATED
                        </span>
                      )}
                      {totalSeen >= 3 && !isDeactivated && (
                        <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-1.5 py-0.2 rounded font-bold">
                          ALL 3 FOUND
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center space-x-2">
                      <span>In Hand: <strong className="text-neutral-200">{inHandCount}</strong></span>
                      <span>·</span>
                      <span>In Cemetery: <strong className="text-neutral-200">{inCemeteryCount}</strong></span>
                      <span>·</span>
                      <span>Total Seen: <strong className="text-amber-400">{totalSeen}/3</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator & Interactive Tag */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleNote(item.suit)}
                    disabled={isImpossible}
                    className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase cursor-pointer border ${
                      isImpossible
                        ? 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                        : note === 'SUSPECT'
                        ? 'bg-amber-400 text-black border-amber-300'
                        : note === 'SAFE'
                        ? 'bg-blue-900/60 text-blue-300 border-blue-700'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    {isImpossible
                      ? 'RULED OUT'
                      : note === 'SUSPECT'
                      ? '🎯 PRIME SUSPECT'
                      : note === 'SAFE'
                      ? '🛡️ MARKED SAFE'
                      : 'TAG SUSPECT'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Target Card has exactly 1 of the 5 suits</span>
          <span>Tap buttons above to track suspicions</span>
        </div>
      </div>
    </div>
  );
};
