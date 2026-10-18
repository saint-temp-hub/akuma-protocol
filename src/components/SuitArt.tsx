import React from 'react';
import type { Suit } from '../game/types.ts';

interface SuitArtProps {
  suit: Suit | string;
  className?: string;
  size?: number | string;
}

/**
 * High-fidelity occult card art directly inspired by the user's reference designs:
 * 1. Horned Demonic Spade (obsidian with demonic horn flourishes)
 * 2. Barbed Crimson Devil Heart (intertwined with thorns, devil tail tip)
 * 3. Volcanic Obsidian Diamond (shattered volcanic rock with glowing magma veins)
 * 4. Triple Skull Club (three gothic skulls crowned together with bone stem)
 * 5. Baphomet / Demonic Horned Ram (curling ram horns, sacred geometric seal)
 */

export const HornedSpadeIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-full h-full',
  size,
}) => (
  <svg
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="spadeShade" x1="50" y1="0" x2="50" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2A2A2E" />
        <stop offset="50%" stopColor="#17171A" />
        <stop offset="100%" stopColor="#0B0B0D" />
      </linearGradient>
      <linearGradient id="spadeGlow" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
      </linearGradient>
      <filter id="spadeDepth" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#spadeDepth)">
      {/* Outer Horned Spade Silhouette */}
      <path
        d="M 50,6 
           C 53,16 63,22 75,20 
           C 87,18 94,8 96,2 
           C 95,16 88,32 78,42 
           C 88,52 94,66 90,82 
           C 86,96 72,102 59,96 
           C 56,94 53,90 52,86 
           L 54,106 
           C 58,110 66,112 70,116 
           L 30,116 
           C 34,112 42,110 46,106 
           L 48,86 
           C 47,90 44,94 41,96 
           C 28,102 14,96 10,82 
           C 6,66 12,52 22,42 
           C 12,32 5,16 4,2 
           C 6,8 13,18 25,20 
           C 37,22 47,16 50,6 Z"
        fill="url(#spadeShade)"
        stroke="#4B5563"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Interior Demonic Carving Facets */}
      <path
        d="M 50,18 
           C 56,36 78,46 76,74 
           C 74,86 64,90 54,82 
           C 52,80 51,76 50,72 
           C 49,76 48,80 46,82 
           C 36,90 26,86 24,74 
           C 22,46 44,36 50,18 Z"
        fill="#111113"
        stroke="#374151"
        strokeWidth="1.5"
      />
      {/* Central Spine */}
      <path d="M 50,22 L 50,78" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="50" cy="52" r="3" fill="#60A5FA" opacity="0.7" />
    </g>
  </svg>
);

export const BarbedHeartIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-full h-full',
  size,
}) => (
  <svg
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="heartShade" x1="50" y1="10" x2="50" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="45%" stopColor="#991B1B" />
        <stop offset="90%" stopColor="#450A0A" />
      </linearGradient>
      <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#heartShadow)">
      {/* Main Barbed Heart with Demonic Tail */}
      <path
        d="M 50,28 
           C 42,12 24,6 12,18 
           C 0,30 2,52 14,70 
           C 26,88 44,104 50,114 
           C 56,104 74,88 86,70 
           C 98,52 100,30 88,18 
           C 76,6 58,12 50,28 Z"
        fill="url(#heartShade)"
        stroke="#F87171"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Thorn Vines & Barbed Cuts */}
      <path
        d="M 28,34 Q 38,44 50,42 Q 62,40 72,50
           M 20,56 Q 34,64 50,60 Q 66,56 80,68
           M 34,78 Q 44,88 50,86 Q 56,84 66,92"
        stroke="#1C0606"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 28,34 Q 38,44 50,42 Q 62,40 72,50
           M 20,56 Q 34,64 50,60 Q 66,56 80,68
           M 34,78 Q 44,88 50,86 Q 56,84 66,92"
        stroke="#EF4444"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Devil Barbed Tail Hook at the bottom tip */}
      <path
        d="M 50,112 C 52,118 56,122 62,120 C 66,118 64,112 60,110 L 52,110"
        stroke="#F87171"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export const ObsidianDiamondIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-full h-full',
  size,
}) => (
  <svg
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="rockShade1" x1="0" y1="0" x2="50" y2="60">
        <stop offset="0%" stopColor="#2E2E33" />
        <stop offset="100%" stopColor="#141416" />
      </linearGradient>
      <linearGradient id="rockShade2" x1="100" y1="0" x2="50" y2="60">
        <stop offset="0%" stopColor="#1E1E22" />
        <stop offset="100%" stopColor="#0D0D0E" />
      </linearGradient>
      <linearGradient id="lavaVein" x1="0" y1="0" x2="100" y2="120">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <filter id="diamondShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#diamondShadow)">
      {/* Shattered Rock Diamond Outline */}
      <path
        d="M 50,6 
           L 78,32 
           L 94,60 
           L 76,88 
           L 50,114 
           L 24,88 
           L 6,60 
           L 22,32 Z"
        fill="#121214"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinejoin="bevel"
      />
      {/* Facet Geometries */}
      <polygon points="50,6 78,32 50,60" fill="url(#rockShade1)" stroke="#27272A" strokeWidth="1" />
      <polygon points="50,6 22,32 50,60" fill="url(#rockShade2)" stroke="#27272A" strokeWidth="1" />
      <polygon points="22,32 6,60 50,60" fill="#1C1C1F" stroke="#27272A" strokeWidth="1" />
      <polygon points="78,32 94,60 50,60" fill="#18181B" stroke="#27272A" strokeWidth="1" />
      <polygon points="6,60 24,88 50,60" fill="url(#rockShade2)" stroke="#27272A" strokeWidth="1" />
      <polygon points="94,60 76,88 50,60" fill="url(#rockShade1)" stroke="#27272A" strokeWidth="1" />
      <polygon points="24,88 50,114 50,60" fill="#111113" stroke="#27272A" strokeWidth="1" />
      <polygon points="76,88 50,114 50,60" fill="#1E1E22" stroke="#27272A" strokeWidth="1" />
      {/* Glowing Magma / Lava Seams */}
      <path
        d="M 50,14 L 46,38 L 54,58 L 48,82 L 50,106
           M 28,42 L 46,52 L 72,50
           M 36,78 L 54,68 L 68,76"
        stroke="url(#lavaVein)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="54" cy="58" r="2.5" fill="#FEF08A" />
      <circle cx="48" cy="82" r="2" fill="#F97316" />
    </g>
  </svg>
);

export const TripleSkullClubIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-full h-full',
  size,
}) => (
  <svg
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="boneShade" x1="50" y1="10" x2="50" y2="110">
        <stop offset="0%" stopColor="#2E3036" />
        <stop offset="60%" stopColor="#18191C" />
        <stop offset="100%" stopColor="#0B0C0E" />
      </linearGradient>
      <filter id="clubShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#clubShadow)">
      {/* Bone Stem */}
      <path
        d="M 50,66 L 50,102 C 54,106 62,108 68,114 L 32,114 C 38,108 46,106 50,102 Z"
        fill="url(#boneShade)"
        stroke="#4B5563"
        strokeWidth="2"
      />
      {/* Top Skull */}
      <g transform="translate(32, 8) scale(0.72)">
        <path
          d="M 25,6 C 14,6 6,14 6,26 C 6,34 10,40 14,46 L 14,54 L 36,54 L 36,46 C 40,40 44,34 44,26 C 44,14 36,6 25,6 Z"
          fill="url(#boneShade)"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        {/* Eye sockets & nose */}
        <ellipse cx="18" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <ellipse cx="32" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <polygon points="25,36 22,42 28,42" fill="#0A0A0C" />
        {/* Teeth */}
        <line x1="20" y1="50" x2="20" y2="54" stroke="#0A0A0C" strokeWidth="2" />
        <line x1="25" y1="50" x2="25" y2="54" stroke="#0A0A0C" strokeWidth="2" />
        <line x1="30" y1="50" x2="30" y2="54" stroke="#0A0A0C" strokeWidth="2" />
      </g>
      {/* Left Skull */}
      <g transform="translate(8, 38) scale(0.68) rotate(-18, 25, 25)">
        <path
          d="M 25,6 C 14,6 6,14 6,26 C 6,34 10,40 14,46 L 14,54 L 36,54 L 36,46 C 40,40 44,34 44,26 C 44,14 36,6 25,6 Z"
          fill="url(#boneShade)"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        <ellipse cx="18" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <ellipse cx="32" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <polygon points="25,36 22,42 28,42" fill="#0A0A0C" />
      </g>
      {/* Right Skull */}
      <g transform="translate(56, 38) scale(0.68) rotate(18, 25, 25)">
        <path
          d="M 25,6 C 14,6 6,14 6,26 C 6,34 10,40 14,46 L 14,54 L 36,54 L 36,46 C 40,40 44,34 44,26 C 44,14 36,6 25,6 Z"
          fill="url(#boneShade)"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        <ellipse cx="18" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <ellipse cx="32" cy="28" rx="4.5" ry="6" fill="#0A0A0C" />
        <polygon points="25,36 22,42 28,42" fill="#0A0A0C" />
      </g>
    </g>
  </svg>
);

export const BaphometDemonIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-full h-full',
  size,
}) => (
  <svg
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="demonRed" x1="50" y1="0" x2="50" y2="120">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="50%" stopColor="#991B1B" />
        <stop offset="100%" stopColor="#450A0A" />
      </linearGradient>
      <filter id="demonShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
      </filter>
    </defs>
    <g filter="url(#demonShadow)">
      {/* Inverted Occult Geometry Triangle */}
      <polygon
        points="50,116 12,38 88,38"
        stroke="#DC2626"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        fill="none"
        opacity="0.6"
      />
      <circle cx="50" cy="62" r="34" stroke="#991B1B" strokeWidth="1.2" fill="none" opacity="0.4" />

      {/* Massive Curving Horns */}
      <path
        d="M 38,40 
           C 28,18 10,14 4,28 
           C -2,40 6,56 18,60 
           C 24,62 30,56 34,48
           M 62,40 
           C 72,18 90,14 96,28 
           C 102,40 94,56 82,60 
           C 76,62 70,56 66,48"
        fill="url(#demonRed)"
        stroke="#F87171"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Demonic Ram Skull Head */}
      <path
        d="M 38,40 
           L 62,40 
           C 66,48 70,58 66,74 
           L 56,106 
           L 50,112 
           L 44,106 
           L 34,74 
           C 30,58 34,48 38,40 Z"
        fill="#1C0808"
        stroke="#EF4444"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Brow Ridges & Horn Ridges */}
      <path d="M 40,46 Q 50,42 60,46" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
      <path d="M 42,54 Q 50,50 58,54" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />

      {/* Piercing Demon Eyes */}
      <polygon points="40,62 48,64 42,67" fill="#FBBF24" />
      <polygon points="60,62 52,64 58,67" fill="#FBBF24" />

      {/* Vertical Occult Arrow & Muzzle Spikes */}
      <line x1="50" y1="12" x2="50" y2="34" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="44,20 50,12 56,20" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="44" y1="96" x2="56" y2="96" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="102" x2="54" y2="102" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

/**
 * Ornate Occult Card Back matching the ritual table from `main splash.jpg`
 */
export const OccultCardBackArt: React.FC<{ team?: 'A' | 'B'; className?: string }> = ({
  team = 'A',
  className = 'w-full h-full',
}) => {
  const primaryGlow = team === 'A' ? '#DC2626' : '#06B6D4';
  const borderTone = team === 'A' ? '#991B1B' : '#0E7490';
  const fillAccent = team === 'A' ? '#450A0A' : '#083344';

  return (
    <svg viewBox="0 0 100 145" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id={`backGlow_${team}`} cx="50" cy="72" r="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryGlow} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0B0B0C" stopOpacity="0.95" />
        </radialGradient>
      </defs>

      {/* Dark Linen Background */}
      <rect x="2" y="2" width="96" height="141" rx="10" fill="#0C0D10" stroke="#26262B" strokeWidth="2" />
      <rect x="5" y="5" width="90" height="135" rx="8" fill={`url(#backGlow_${team})`} />

      {/* Intricate Gold/Crimson Filigree Border */}
      <rect
        x="8"
        y="8"
        width="84"
        height="129"
        rx="6"
        fill="none"
        stroke={borderTone}
        strokeWidth="1.2"
        strokeDasharray="8 3"
      />

      {/* Corner Ornaments */}
      <path d="M 12,12 L 20,12 M 12,12 L 12,20" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M 88,12 L 80,12 M 88,12 L 88,20" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M 12,133 L 20,133 M 12,133 L 12,125" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M 88,133 L 80,133 M 88,133 L 88,125" stroke="#F59E0B" strokeWidth="1.5" />

      {/* Central Concentric Occult Rings & Sigils */}
      <circle cx="50" cy="72.5" r="28" stroke="#F59E0B" strokeWidth="1.2" fill={fillAccent} fillOpacity="0.6" />
      <circle cx="50" cy="72.5" r="23" stroke={primaryGlow} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="50" cy="72.5" r="17" stroke="#F59E0B" strokeWidth="1" />

      {/* Geometric Pentagram / Hexagram Star */}
      <polygon
        points="50,56 63,80 37,80"
        stroke="#F59E0B"
        strokeWidth="1.2"
        fill="none"
      />
      <polygon
        points="50,89 63,65 37,65"
        stroke="#F59E0B"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Center Evil Eye / Gem */}
      <circle cx="50" cy="72.5" r="4.5" fill="#EF4444" stroke="#FCD34D" strokeWidth="1" />
      <circle cx="50" cy="72.5" r="1.5" fill="#FEF08A" />

      {/* Top & Bottom Runic Markings */}
      <text x="50" y="22" font-family="monospace" font-size="6" fill="#F59E0B" text-anchor="middle" letter-spacing="2">
        ✦ AKUMA ✦
      </text>
      <text x="50" y="128" font-family="monospace" font-size="6" fill="#F59E0B" text-anchor="middle" letter-spacing="2">
        ✦ OCCULT ✦
      </text>
    </svg>
  );
};

export const SuitArt: React.FC<SuitArtProps> = ({ suit, className = 'w-full h-full', size }) => {
  switch (suit?.toUpperCase()) {
    case 'SPADES':
      return <HornedSpadeIcon className={className} size={size} />;
    case 'HEARTS':
      return <BarbedHeartIcon className={className} size={size} />;
    case 'DIAMONDS':
      return <ObsidianDiamondIcon className={className} size={size} />;
    case 'CLUBS':
      return <TripleSkullClubIcon className={className} size={size} />;
    case 'DEMON':
      return <BaphometDemonIcon className={className} size={size} />;
    default:
      return <span className="text-xl font-bold">?</span>;
  }
};
