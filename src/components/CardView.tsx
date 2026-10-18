import React from 'react';
import type { Card, Team } from '../game/types.ts';
import { SuitArt, OccultCardBackArt } from './SuitArt.tsx';

interface CardViewProps {
  card?: Card | null;
  masked?: boolean;
  team?: Team;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  isTargetVault?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  masked = false,
  team = 'A',
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
  label,
  isTargetVault = false,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24 sm:w-20 sm:h-28 text-xs',
    md: 'w-24 h-36 sm:w-28 sm:h-42 text-sm',
    lg: 'w-32 h-48 sm:w-36 sm:h-54 text-base',
  }[size];

  // Suit styling accents
  const getSuitAccent = (suit?: string) => {
    switch (suit) {
      case 'HEARTS':
      case 'DEMON':
        return {
          cornerColor: 'text-red-500',
          borderColor: 'border-red-950/80',
          selectedRing: 'ring-red-500 shadow-red-500/40',
        };
      case 'DIAMONDS':
        return {
          cornerColor: 'text-amber-500',
          borderColor: 'border-amber-950/80',
          selectedRing: 'ring-amber-400 shadow-amber-500/40',
        };
      case 'SPADES':
      case 'CLUBS':
      default:
        return {
          cornerColor: 'text-neutral-300',
          borderColor: 'border-neutral-800',
          selectedRing: 'ring-cyan-400 shadow-cyan-400/40',
        };
    }
  };

  const suitAccent = getSuitAccent(card?.suit);

  // 1. Face-Down Card or Sealed Vault Card (Matching `main splash.jpg`)
  if (masked || !card) {
    const borderAccent = selected
      ? 'ring-4 ring-amber-400 -translate-y-3 scale-105 shadow-2xl shadow-amber-500/50'
      : isTargetVault
      ? 'ring-2 ring-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse'
      : 'border border-neutral-800/80 hover:border-amber-500/50 shadow-lg';

    return (
      <div
        role="button"
        tabIndex={onClick && !disabled ? 0 : -1}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={(e) => {
          if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={label || (isTargetVault ? 'Sealed Target Card' : 'Face-down card')}
        className={`${sizeClasses} ${borderAccent} relative rounded-2xl select-none transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1.5 hover:shadow-2xl`}
      >
        {/* Ornate Occult Card Back Artwork */}
        <OccultCardBackArt team={team} className="w-full h-full object-cover" />

        {/* Ethereal Floating Vault Aura (main splash reference) */}
        {isTargetVault && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none ring-2 ring-cyan-400/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.3)] animate-pulse" />
        )}

        {/* Discreet Badge */}
        {label && (
          <div className="absolute bottom-1.5 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-black/80 border border-neutral-700 text-[9px] font-mono text-neutral-300 font-bold uppercase tracking-wider backdrop-blur-sm">
            {label}
          </div>
        )}
      </div>
    );
  }

  // 2. Face-Up Card (Matching `5 cards pack.jpg`)
  // Crisp textured linen face with beveled border, corner pips, and central custom demon suit art
  const cardCopy = card.copyNumber || 1;
  const isSelectedStyle = selected
    ? `ring-4 ${suitAccent.selectedRing} -translate-y-3.5 scale-105 shadow-2xl z-10`
    : 'border border-neutral-800 hover:border-neutral-600 shadow-xl';

  return (
    <div
      role="button"
      tabIndex={onClick && !disabled ? 0 : -1}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={(e) => {
        if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={label || `${card.suit} card copy ${cardCopy}`}
      className={`${sizeClasses} ${isSelectedStyle} relative rounded-2xl bg-[#0F0F12] flex flex-col justify-between p-2 sm:p-2.5 select-none transition-all duration-200 cursor-pointer overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl group`}
      style={{
        boxShadow: selected
          ? '0 12px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.3)'
          : '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Textured Linen Canvas Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(#ffffff 0.75px, transparent 0.75px), radial-gradient(#ffffff 0.75px, #0F0F12 0.75px)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px',
        }}
      />

      {/* Ornate Inset Double Border */}
      <div className="absolute inset-1.5 rounded-xl border border-neutral-800/90 pointer-events-none group-hover:border-neutral-700/80 transition-colors" />

      {/* Top-Left Corner Index */}
      <div className="relative z-10 flex flex-col items-center w-5 leading-none">
        <span className={`font-mono font-black text-xs sm:text-sm tracking-tight ${suitAccent.cornerColor}`}>
          {cardCopy}
        </span>
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5">
          <SuitArt suit={card.suit} />
        </div>
      </div>

      {/* Centerpiece Demonic Artwork (from `5 cards pack.jpg`) */}
      <div className="relative z-10 self-center w-12 h-14 sm:w-16 sm:h-20 flex items-center justify-center transform group-hover:scale-108 transition-transform duration-300">
        <SuitArt suit={card.suit} />
      </div>

      {/* Bottom-Right Corner Index (Inverted) */}
      <div className="relative z-10 flex flex-col items-center w-5 leading-none self-end rotate-180">
        <span className={`font-mono font-black text-xs sm:text-sm tracking-tight ${suitAccent.cornerColor}`}>
          {cardCopy}
        </span>
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5">
          <SuitArt suit={card.suit} />
        </div>
      </div>

      {/* Selected Indicator Glow */}
      {selected && (
        <div className="absolute top-1 right-1.5 z-20 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      )}
    </div>
  );
};
