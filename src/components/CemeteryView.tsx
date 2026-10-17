import React from 'react';
import type { Card } from '../game/types.ts';
import { SUITS } from '../game/types.ts';
import { CardView } from './CardView.tsx';

interface CemeteryViewProps {
  cemetery: Card[];
  isBlackoutActive?: boolean;
}

export const CemeteryView: React.FC<CemeteryViewProps> = ({
  cemetery,
  isBlackoutActive = false,
}) => {
  return (
    <div className="w-full bg-[#141414] border border-neutral-800 rounded-2xl p-3 sm:p-4 my-2 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase tracking-widest text-neutral-300 font-mono font-bold">
            CEMETERY (DISCARD PILE)
          </span>
          <span className="bg-neutral-800 text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
            {cemetery.length} CARDS
          </span>
        </div>

        {/* Suit Breakdown pill */}
        {!isBlackoutActive && cemetery.length > 0 && (
          <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
            {SUITS.map((s) => {
              const count = cemetery.filter((c) => c.suit === s.suit).length;
              return (
                <span key={s.suit} className={count > 0 ? 'text-amber-400 font-bold' : 'text-neutral-600'}>
                  {s.symbol} {count}
                </span>
              );
            })}
          </div>
        )}

        {isBlackoutActive && (
          <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/60 px-2.5 py-0.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[10px] font-mono font-bold text-red-200 uppercase tracking-widest">
              BLACKOUT ACTIVE (2 TURNS)
            </span>
          </div>
        )}
      </div>

      {isBlackoutActive ? (
        <div className="py-6 px-4 border border-dashed border-red-900/60 bg-red-950/20 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="text-red-400 font-mono text-xs sm:text-sm font-bold tracking-widest mb-1">
            ■■ CEMETERY IS BLACKED OUT ■■
          </div>
          <p className="text-xs font-mono text-red-400/90 max-w-sm">
            Opponents activated Cemetery Blackout! Discard pile is hidden for your team for this turn.
          </p>
        </div>
      ) : cemetery.length === 0 ? (
        <div className="py-5 text-center border border-dashed border-neutral-800/80 rounded-xl">
          <p className="text-xs font-mono text-neutral-500">
            No cards discarded to the cemetery yet.
          </p>
        </div>
      ) : (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {cemetery.map((card, idx) => (
            <div key={`${card.id}-${idx}`} className="shrink-0 transform hover:scale-105 transition-transform">
              <CardView card={card} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
