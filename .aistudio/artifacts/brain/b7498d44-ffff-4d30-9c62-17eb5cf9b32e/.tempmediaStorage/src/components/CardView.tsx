import React from 'react';
import type { Card, Team } from '../game/types.ts';

interface CardViewProps {
  card?: Card | null;
  masked?: boolean;
  team?: Team;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
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
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24 sm:w-18 sm:h-28 text-xs',
    md: 'w-24 h-34 sm:w-28 sm:h-40 text-sm',
    lg: 'w-30 h-44 sm:w-36 sm:h-52 text-base',
  }[size];

  // Render high-contrast crisp vector suit icons (Black/charcoal per game specification)
  const renderSuitIcon = (suit?: string, iconSize = 'md') => {
    switch (suit) {
      case 'SPADES':
        return (
          <span
            className={
              iconSize === 'lg'
                ? 'text-4xl sm:text-5xl font-black text-neutral-900 select-none'
                : 'text-2xl font-black text-neutral-900 select-none'
            }
          >
            ♠
          </span>
        );
      case 'HEARTS':
        return (
          <span
            className={
              iconSize === 'lg'
                ? 'text-4xl sm:text-5xl font-black text-neutral-900 select-none'
                : 'text-2xl font-black text-neutral-900 select-none'
            }
          >
            ♥
          </span>
        );
      case 'DIAMONDS':
        return (
          <span
            className={
              iconSize === 'lg'
                ? 'text-4xl sm:text-5xl font-black text-neutral-900 select-none'
                : 'text-2xl font-black text-neutral-900 select-none'
            }
          >
            ♦
          </span>
        );
      case 'CLUBS':
        return (
          <span
            className={
              iconSize === 'lg'
                ? 'text-4xl sm:text-5xl font-black text-neutral-900 select-none'
                : 'text-2xl font-black text-neutral-900 select-none'
            }
          >
            ♣
          </span>
        );
      case 'DEMON':
        return (
          <div
            className={`flex items-center justify-center ${
              iconSize === 'lg' ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-6 h-6'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full text-neutral-950 drop-shadow-sm"
            >
              {/* Stylized sharp horned demon crest */}
              <path d="M12 2C9.5 2 7.8 3.5 6 6C4.5 4.5 3 4 2 5C2 7.5 3.5 10 5.2 11.2C5.1 11.8 5 12.4 5 13C5 17.5 8.1 21.2 12 22C15.9 21.2 19 17.5 19 13C19 12.4 18.9 11.8 18.8 11.2C20.5 10 22 7.5 22 5C21 4 19.5 4.5 18 6C16.2 3.5 14.5 2 12 2ZM9 12C9.8 12 10.5 12.7 10.5 13.5C10.5 14.3 9.8 15 9 15C8.2 15 7.5 14.3 7.5 13.5C7.5 12.7 8.2 12 9 12ZM15 12C15.8 12 16.5 12.7 16.5 13.5C16.5 14.3 15.8 15 15 15C14.2 15 13.5 14.3 13.5 13.5C13.5 12.7 14.2 12 15 12ZM10.5 18L12 16.5L13.5 18H10.5Z" />
            </svg>
          </div>
        );
      default:
        return <span>?</span>;
    }
  };

  const suitSymbol = card?.symbol || '?';

  if (masked || !card) {
    // Face-down card with casino interlocking pattern & generated demonic casino emblem medallion
    const backClass = team === 'A' ? 'card-back-crimson' : 'card-back-navy';
    const borderAccent = selected
      ? 'ring-2 ring-amber-400 -translate-y-2.5 shadow-xl shadow-amber-500/20'
      : team === 'A'
      ? 'border-red-900/60 shadow-lg'
      : 'border-cyan-900/60 shadow-lg';

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
        aria-label={label || 'Face-down card'}
        className={`${sizeClasses} ${backClass} ${borderAccent} relative rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200 overflow-hidden hover:scale-102 hover:shadow-2xl`}
      >
        {/* Intricate casino foil circular medallion */}
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-amber-400/50 shadow-inner flex items-center justify-center bg-black/80">
          <img
            src="/src/assets/images/akuma_card_emblem_1792175811491.jpg"
            alt="Card back crest"
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Team indicator badge */}
        <div className="absolute top-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/80 border border-white/10 text-neutral-300">
          {team}
        </div>

        {label && (
          <span className="absolute bottom-1.5 text-[9px] text-white/70 font-mono tracking-widest uppercase">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Face-up card: Luxury linen ivory background with high contrast suits
  const isSelectedStyle = selected
    ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-black -translate-y-3 shadow-2xl shadow-amber-500/40 scale-104'
    : 'border border-neutral-300/80 shadow-md hover:-translate-y-2 hover:shadow-xl';

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
      aria-label={label || `Card: ${card.suit}`}
      className={`${sizeClasses} playing-card-face ${isSelectedStyle} relative rounded-2xl flex flex-col justify-between p-2.5 sm:p-3 select-none cursor-pointer transition-all duration-200`}
    >
      {/* Top Left Index */}
      <div className="flex flex-col items-start leading-none pointer-events-none">
        <span className="text-sm sm:text-base font-black text-neutral-900">{suitSymbol}</span>
        <span className="text-[9px] font-mono uppercase tracking-tight text-neutral-500 font-bold mt-0.5">
          {card.suit.substring(0, 3)}
        </span>
      </div>

      {/* Centered Large High-Contrast Suit Vector */}
      <div className="flex items-center justify-center my-auto pointer-events-none">
        {renderSuitIcon(card.suit, 'lg')}
      </div>

      {/* Bottom Right Index */}
      <div className="flex flex-col items-end leading-none pointer-events-none rotate-180">
        <span className="text-sm sm:text-base font-black text-neutral-900">{suitSymbol}</span>
        <span className="text-[9px] font-mono uppercase tracking-tight text-neutral-500 font-bold mt-0.5">
          {card.suit.substring(0, 3)}
        </span>
      </div>

      {/* Selected Indicator Badge (Local Only) */}
      {selected && (
        <div className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg font-mono flex items-center space-x-1">
          <span>✓</span>
        </div>
      )}
    </div>
  );
};
