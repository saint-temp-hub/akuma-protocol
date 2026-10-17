export type Suit = 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'DEMON';

export interface Card {
  id: string;
  suit: Suit;
  symbol: string;
}

export type Team = 'A' | 'B';
export type GameMode = 'NORMAL' | 'AKUMA';
export type GamePhase = 'LOBBY' | 'PLAYING' | 'ROUND_OVER';

export interface Player {
  id: string;
  name: string;
  team: Team;
  slot: number; // 0: A1, 1: B1, 2: A2, 3: B2
  rating: number; // Cumulative weighted rating
  roundPoints: number; // Points earned in current round
  ability?: string; // 1 of the 8 Akuma outlaw abilities
  abilityUsed?: boolean;
  isHost?: boolean;
  connected?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  team: Team;
  text: string;
  timestamp: number;
}

export interface InterceptionNotification {
  type: 'TACTICAL_ERROR' | 'DEFENSE_SHIELD';
  message: string;
  timestamp: number;
}

export interface GameState {
  room: string;
  phase: GamePhase;
  gameMode: GameMode;
  deck: Card[];
  targetCard: Card | null;
  handA: Card[];
  handB: Card[];
  cemetery: Card[];
  rotation: string[]; // [pA1.id, pB1.id, pA2.id, pB2.id]
  currentTurnIndex: number;
  deactivatedSuits: Suit[];
  winnerTeam: Team | null;
  roundWinnerSuit: Suit | null;
  lastActionMessage: string | null;
  blackoutCounter: number; // Decrements on turn pass
  blackoutTeamTarget?: Team | null; // Team whose cemetery view is blacked out
  mindControlPayloadActive: boolean;
  mindControlAttackerId?: string;
  mindControlTargetPlayerId?: string;
  darkTransmissionActive: boolean;
  darkTransmissionTeam: Team | null;
  commsHistory: ChatMessage[];
  roundNumber: number;
  players: Player[];
  updatedAt: number;
}

export const SUITS: { suit: Suit; symbol: string; name: string }[] = [
  { suit: 'SPADES', symbol: '♠', name: 'Spades' },
  { suit: 'HEARTS', symbol: '♥', name: 'Hearts' },
  { suit: 'DIAMONDS', symbol: '♦', name: 'Diamonds' },
  { suit: 'CLUBS', symbol: '♣', name: 'Clubs' },
  { suit: 'DEMON', symbol: '👿', name: 'Demon' },
];

export interface OutlawAbilityDef {
  id: string;
  name: string;
  type: 'ACTIVE' | 'PASSIVE';
  description: string;
}

export const OUTLAW_ABILITIES: Record<string, OutlawAbilityDef> = {
  DEVILS_MONOCLE: {
    id: 'DEVILS_MONOCLE',
    name: "Devil's Monocle",
    type: 'ACTIVE',
    description: "Reveals the opposing team's hidden cards exclusively to you on your screen for this turn. Your teammate and opponents cannot see them. Re-masks automatically when your turn ends.",
  },
  CEMETERY_BLACKOUT: {
    id: 'CEMETERY_BLACKOUT',
    name: 'Cemetery Blackout',
    type: 'ACTIVE',
    description: "Blacks out and redacts the Cemetery discard pile for the opposing team for their next 2 turns. Your team can still see the Cemetery clearly.",
  },
  NO_DISTRACTIONS: {
    id: 'NO_DISTRACTIONS',
    name: 'No Distractions',
    type: 'PASSIVE',
    description: "Passive trap shield. Triggers automatically if an opponent targets your team with Mind Control or Cemetery Blackout, completely neutralizing the attack.",
  },
  FATED_GLIMPSE: {
    id: 'FATED_GLIMPSE',
    name: 'Fated Glimpse',
    type: 'ACTIVE',
    description: "Privately peeks at the top card of the draw deck and reveals its suit only to you in a secret popover. Zero tells to other players.",
  },
  WHISPERED_ELIMINATION: {
    id: 'WHISPERED_ELIMINATION',
    name: 'Whispered Elimination',
    type: 'ACTIVE',
    description: "Privately highlights one safe suit on your deduction board that is NOT the hidden target card suit and has not yet been eliminated.",
  },
  DARK_TRANSMISSION: {
    id: 'DARK_TRANSMISSION',
    name: 'Dark Transmission',
    type: 'ACTIVE',
    description: "Opens a private encrypted 2-way chat channel strictly between you and your teammate during your turn. Closes and purges all messages automatically when your turn ends.",
  },
  CATACLYSMIC_SWAP: {
    id: 'CATACLYSMIC_SWAP',
    name: 'Cataclysmic Swap',
    type: 'ACTIVE',
    description: "Forcibly swaps your team's entire 3-card hand with the opposing team's 3-card hand across the entire table.",
  },
  MIND_CONTROL: {
    id: 'MIND_CONTROL',
    name: 'Mind Control',
    type: 'ACTIVE',
    description: "Arms mind control targeting the next opponent. When their turn comes, YOU take control of their turn! You choose whether to force them to discard specific cards or force them to make a suit guess.",
  },
};
