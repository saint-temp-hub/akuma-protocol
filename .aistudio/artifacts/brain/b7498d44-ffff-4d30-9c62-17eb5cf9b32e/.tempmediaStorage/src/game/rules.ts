import type {
  Card,
  GameState,
  Player,
  Suit,
  Team,
} from './types.ts';
import {
  SUITS,
  OUTLAW_ABILITIES,
} from './types.ts';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 1;

  for (const suitDef of SUITS) {
    for (let i = 0; i < 3; i++) {
      deck.push({
        id: `card_${suitDef.suit.toLowerCase()}_${i + 1}_${cardId++}`,
        suit: suitDef.suit,
        symbol: suitDef.symbol,
      });
    }
  }

  return deck;
}

export function shuffle<T>(array: T[], rng = Math.random): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function calculateRating(pointsThisRound: number, previousRating: number): number {
  const newRating = pointsThisRound * 0.7 + previousRating * 0.3;
  return Math.round(newRating * 10) / 10;
}

export function createInitialState(room: string, hostPlayer?: Player): GameState {
  const players = hostPlayer ? [hostPlayer] : [];
  return {
    room,
    phase: 'LOBBY',
    gameMode: 'NORMAL',
    deck: [],
    targetCard: null,
    handA: [],
    handB: [],
    cemetery: [],
    rotation: [],
    currentTurnIndex: 0,
    deactivatedSuits: [],
    winnerTeam: null,
    roundWinnerSuit: null,
    lastActionMessage: 'Lobby ready. Waiting for 4 players.',
    blackoutCounter: 0,
    blackoutTeamTarget: null,
    mindControlPayloadActive: false,
    mindControlAttackerId: undefined,
    mindControlTargetPlayerId: undefined,
    darkTransmissionActive: false,
    darkTransmissionTeam: null,
    commsHistory: [],
    roundNumber: 1,
    players,
    updatedAt: Date.now(),
  };
}

export function assignAbilitiesToPlayers(players: Player[], rng = Math.random): Player[] {
  const abilityKeys = Object.keys(OUTLAW_ABILITIES);
  const shuffledKeys = shuffle(abilityKeys, rng);

  return players.map((player, idx) => ({
    ...player,
    ability: shuffledKeys[idx % shuffledKeys.length],
    abilityUsed: false,
  }));
}

export function startNewRound(state: GameState, rng = Math.random): GameState {
  const freshDeck = shuffle(createDeck(), rng);
  const targetCard = freshDeck.pop() || null;
  const handA = [freshDeck.pop()!, freshDeck.pop()!, freshDeck.pop()!];
  const handB = [freshDeck.pop()!, freshDeck.pop()!, freshDeck.pop()!];

  let updatedPlayers = state.players.map((p) => ({
    ...p,
    roundPoints: 0,
  }));

  if (state.gameMode === 'AKUMA') {
    updatedPlayers = assignAbilitiesToPlayers(updatedPlayers, rng);
  } else {
    updatedPlayers = updatedPlayers.map((p) => ({
      ...p,
      ability: undefined,
      abilityUsed: undefined,
    }));
  }

  // Rotation: A1 -> B1 -> A2 -> B2
  const pA1 = updatedPlayers.find((p) => p.slot === 0);
  const pB1 = updatedPlayers.find((p) => p.slot === 1);
  const pA2 = updatedPlayers.find((p) => p.slot === 2);
  const pB2 = updatedPlayers.find((p) => p.slot === 3);

  const rotation = [
    pA1?.id || 'A1',
    pB1?.id || 'B1',
    pA2?.id || 'A2',
    pB2?.id || 'B2',
  ];

  return {
    ...state,
    phase: 'PLAYING',
    deck: freshDeck,
    targetCard,
    handA,
    handB,
    cemetery: [],
    rotation,
    currentTurnIndex: 0,
    deactivatedSuits: [],
    winnerTeam: null,
    roundWinnerSuit: null,
    lastActionMessage: `Round ${state.roundNumber} started. Active player: ${pA1?.name || 'Player 1'}`,
    blackoutCounter: 0,
    blackoutTeamTarget: null,
    mindControlPayloadActive: false,
    mindControlAttackerId: undefined,
    mindControlTargetPlayerId: undefined,
    darkTransmissionActive: false,
    darkTransmissionTeam: null,
    commsHistory: [],
    players: updatedPlayers,
    updatedAt: Date.now(),
  };
}

export function getActivePlayer(state: GameState): Player | undefined {
  const activeId = state.rotation[state.currentTurnIndex];
  return state.players.find((p) => p.id === activeId);
}

export function passActiveTurnSequence(state: GameState): GameState {
  const nextTurnIndex = (state.currentTurnIndex + 1) % 4;
  const nextPlayerId = state.rotation[nextTurnIndex];
  const nextPlayer = state.players.find((p) => p.id === nextPlayerId);

  let blackoutCounter = state.blackoutCounter;
  let blackoutTeamTarget = state.blackoutTeamTarget;

  if (blackoutCounter > 0) {
    blackoutCounter -= 1;
    if (blackoutCounter <= 0) {
      blackoutTeamTarget = null;
    }
  }

  return {
    ...state,
    currentTurnIndex: nextTurnIndex,
    blackoutCounter,
    blackoutTeamTarget,
    darkTransmissionActive: false, // Auto-close transmission on turn end
    darkTransmissionTeam: null,
    commsHistory: [], // Auto-purge chat history completely on turn end
    lastActionMessage: nextPlayer ? `Turn passed to ${nextPlayer.name} (Team ${nextPlayer.team})` : 'Turn passed.',
    updatedAt: Date.now(),
  };
}

export function revealCardsAction(
  state: GameState,
  playerId: string,
  cardIndices: number[],
  rng = Math.random
): { state: GameState; error?: string } {
  const activePlayer = getActivePlayer(state);
  if (!activePlayer || activePlayer.id !== playerId) {
    return { state, error: 'It is not your turn.' };
  }

  if (cardIndices.length < 1 || cardIndices.length > 3) {
    return { state, error: 'Select 1, 2, or 3 cards to reveal.' };
  }

  const team = activePlayer.team;
  const currentHand = team === 'A' ? [...state.handA] : [...state.handB];
  const deck = [...state.deck];
  const cemetery = [...state.cemetery];

  const sortedIndices = [...new Set(cardIndices)].sort((a, b) => b - a);

  for (const idx of sortedIndices) {
    if (idx < 0 || idx >= currentHand.length) {
      return { state, error: 'Invalid card selection.' };
    }
  }

  const discardedCards: Card[] = [];
  for (const idx of sortedIndices) {
    discardedCards.push(currentHand[idx]);
    currentHand.splice(idx, 1);
  }

  cemetery.push(...discardedCards);

  while (currentHand.length < 3 && deck.length > 0) {
    currentHand.push(deck.pop()!);
  }

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, roundPoints: p.roundPoints + 10 };
    }
    return p;
  });

  const intermediateState: GameState = {
    ...state,
    deck,
    cemetery,
    handA: team === 'A' ? currentHand : state.handA,
    handB: team === 'B' ? currentHand : state.handB,
    players: updatedPlayers,
    lastActionMessage: `${activePlayer.name} revealed ${discardedCards.length} card(s) to the cemetery (+10 pts).`,
    updatedAt: Date.now(),
  };

  return { state: passActiveTurnSequence(intermediateState) };
}

export function guessSuitAction(
  state: GameState,
  playerId: string,
  guessedSuit: Suit
): { state: GameState; isCorrect: boolean; error?: string } {
  const activePlayer = getActivePlayer(state);
  if (!activePlayer || activePlayer.id !== playerId) {
    return { state, isCorrect: false, error: 'It is not your turn.' };
  }

  if (state.deactivatedSuits.includes(guessedSuit)) {
    return { state, isCorrect: false, error: 'This suit has already been eliminated.' };
  }

  const isCorrect = state.targetCard?.suit === guessedSuit;

  if (isCorrect) {
    // Correct deduction: Match ends. +50 points to BOTH teammates on winning team.
    const winningTeam = activePlayer.team;
    const updatedPlayers = state.players.map((p) => {
      let roundPts = p.roundPoints;
      if (p.team === winningTeam) {
        roundPts += 50;
      }
      const newRating = calculateRating(roundPts, p.rating);
      return {
        ...p,
        roundPoints: roundPts,
        rating: newRating,
      };
    });

    const finalState: GameState = {
      ...state,
      phase: 'ROUND_OVER',
      winnerTeam: winningTeam,
      roundWinnerSuit: guessedSuit,
      players: updatedPlayers,
      lastActionMessage: `TARGET FOUND! ${activePlayer.name} correctly deduced the Target Suit: ${guessedSuit}! Team ${winningTeam} wins!`,
      commsHistory: [],
      updatedAt: Date.now(),
    };

    return { state: finalState, isCorrect: true };
  } else {
    // Incorrect deduction: -30 points to guessing player, suit deactivated globally, turn passes.
    const deactivatedSuits = [...state.deactivatedSuits, guessedSuit];
    const updatedPlayers = state.players.map((p) => {
      if (p.id === playerId) {
        return { ...p, roundPoints: p.roundPoints - 30 };
      }
      return p;
    });

    const intermediateState: GameState = {
      ...state,
      deactivatedSuits,
      players: updatedPlayers,
      lastActionMessage: `WRONG GUESS! ${activePlayer.name} guessed ${guessedSuit}. -30 pts. Suit eliminated from game.`,
      updatedAt: Date.now(),
    };

    return { state: passActiveTurnSequence(intermediateState), isCorrect: false };
  }
}

export function equalizeAndRebalanceMatrix(state: GameState, rng = Math.random): GameState {
  if (state.players.length < 4) {
    return state;
  }

  // 1. Sort all 4 players by rating descending
  const sorted = [...state.players].sort((a, b) => b.rating - a.rating);

  // 2. Rank 1 & Rank 4 -> Team A
  // 3. Rank 2 & Rank 3 -> Team B
  const pRank1 = { ...sorted[0], team: 'A' as Team, slot: 0 };
  const pRank2 = { ...sorted[1], team: 'B' as Team, slot: 1 };
  const pRank3 = { ...sorted[2], team: 'B' as Team, slot: 3 };
  const pRank4 = { ...sorted[3], team: 'A' as Team, slot: 2 };

  const rebalancedPlayers = [pRank1, pRank2, pRank4, pRank3];

  const resetState: GameState = {
    ...state,
    players: rebalancedPlayers,
    roundNumber: state.roundNumber + 1,
    phase: 'PLAYING',
    handA: [],
    handB: [],
    cemetery: [],
    deck: [],
    targetCard: null,
    deactivatedSuits: [],
    winnerTeam: null,
    roundWinnerSuit: null,
    blackoutCounter: 0,
    blackoutTeamTarget: null,
    mindControlPayloadActive: false,
    mindControlAttackerId: undefined,
    mindControlTargetPlayerId: undefined,
    darkTransmissionActive: false,
    darkTransmissionTeam: null,
    commsHistory: [],
    lastActionMessage: 'Teams equalized and rebalanced based on player ratings.',
    updatedAt: Date.now(),
  };

  return startNewRound(resetState, rng);
}

// ----------------------------------------------------
// THE 8 AKUMA OUTLAW ABILITIES
// ----------------------------------------------------

export interface AbilityExecutionResult {
  state: GameState;
  attackerAlert?: string;
  defenderAlert?: { targetPlayerId: string; message: string };
  error?: string;
}

export function executeOutlawAbility(
  state: GameState,
  playerId: string,
  abilityId: string,
  rng = Math.random
): AbilityExecutionResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { state, error: 'Player not found.' };
  }

  if (state.gameMode !== 'AKUMA') {
    return { state, error: 'Akuma powers are disabled in Normal mode.' };
  }

  if (player.ability !== abilityId) {
    return { state, error: 'You do not have this Akuma power.' };
  }

  if (player.abilityUsed) {
    return { state, error: 'This power has already been used this round.' };
  }

  const opposingTeam: Team = player.team === 'A' ? 'B' : 'A';
  const opponents = state.players.filter((p) => p.team === opposingTeam);
  const opposingShieldHolder = opponents.find(
    (p) => p.ability === 'NO_DISTRACTIONS' && !p.abilityUsed
  );

  let updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, abilityUsed: true };
    }
    return p;
  });

  // Law 1: Devil's Monocle
  if (abilityId === 'DEVILS_MONOCLE') {
    return {
      state: {
        ...state,
        players: updatedPlayers,
        lastActionMessage: `${player.name} activated Devil's Monocle!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 2: Cemetery Blackout
  if (abilityId === 'CEMETERY_BLACKOUT') {
    if (opposingShieldHolder) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === opposingShieldHolder.id ? { ...p, abilityUsed: true } : p
      );
      return {
        state: {
          ...state,
          players: updatedPlayers,
          lastActionMessage: `${player.name} tried to use Cemetery Blackout, but it was blocked by No Distractions!`,
          updatedAt: Date.now(),
        },
        attackerAlert: "Attack Blocked! Opponent's No Distractions trap neutralized your Cemetery Blackout.",
        defenderAlert: {
          targetPlayerId: opposingShieldHolder.id,
          message: "No Distractions Triggered! Your trap shield blocked Cemetery Blackout.",
        },
      };
    }

    return {
      state: {
        ...state,
        blackoutCounter: 2,
        blackoutTeamTarget: opposingTeam,
        players: updatedPlayers,
        lastActionMessage: `${player.name} activated Cemetery Blackout targeting Team ${opposingTeam}!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 3: No Distractions (Passive only)
  if (abilityId === 'NO_DISTRACTIONS') {
    return { state, error: 'No Distractions is a passive trap shield and triggers automatically when attacked.' };
  }

  // Law 4: Fated Glimpse
  if (abilityId === 'FATED_GLIMPSE') {
    return {
      state: {
        ...state,
        players: updatedPlayers,
        lastActionMessage: `${player.name} activated Fated Glimpse!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 5: Whispered Elimination
  if (abilityId === 'WHISPERED_ELIMINATION') {
    return {
      state: {
        ...state,
        players: updatedPlayers,
        lastActionMessage: `${player.name} activated Whispered Elimination!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 6: Dark Transmission
  if (abilityId === 'DARK_TRANSMISSION') {
    return {
      state: {
        ...state,
        darkTransmissionActive: true,
        darkTransmissionTeam: player.team,
        players: updatedPlayers,
        lastActionMessage: `${player.name} opened a Dark Transmission with their teammate!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 7: Cataclysmic Swap
  if (abilityId === 'CATACLYSMIC_SWAP') {
    const tempHandA = [...state.handA];
    const tempHandB = [...state.handB];

    return {
      state: {
        ...state,
        handA: tempHandB,
        handB: tempHandA,
        players: updatedPlayers,
        lastActionMessage: `${player.name} triggered Cataclysmic Swap! Hands have been swapped between Team A and Team B!`,
        updatedAt: Date.now(),
      },
    };
  }

  // Law 8: Mind Control
  if (abilityId === 'MIND_CONTROL') {
    // Determine the next opponent in rotation
    let targetOpponent: Player | undefined;
    for (let step = 1; step <= 4; step++) {
      const candIdx = (state.currentTurnIndex + step) % 4;
      const candId = state.rotation[candIdx];
      const candPlayer = state.players.find((p) => p.id === candId);
      if (candPlayer && candPlayer.team === opposingTeam) {
        targetOpponent = candPlayer;
        break;
      }
    }

    if (opposingShieldHolder) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === opposingShieldHolder.id ? { ...p, abilityUsed: true } : p
      );
      return {
        state: {
          ...state,
          players: updatedPlayers,
          lastActionMessage: `${player.name} attempted Mind Control, but was deflected by No Distractions!`,
          updatedAt: Date.now(),
        },
        attackerAlert: "Attack Deflected! Opponent's No Distractions shield neutralized your Mind Control.",
        defenderAlert: {
          targetPlayerId: opposingShieldHolder.id,
          message: "No Distractions Triggered! Your shield neutralized an incoming Mind Control attack.",
        },
      };
    }

    return {
      state: {
        ...state,
        mindControlPayloadActive: true,
        mindControlAttackerId: player.id,
        mindControlTargetPlayerId: targetOpponent?.id,
        players: updatedPlayers,
        lastActionMessage: `${player.name} armed Mind Control targeting ${targetOpponent?.name || 'the next opponent'}!`,
        updatedAt: Date.now(),
      },
    };
  }

  return { state, error: 'Unknown ability.' };
}

// ----------------------------------------------------
// MIND CONTROL INTERACTION HANDLERS (TRUE PLAYER CONTROL)
// ----------------------------------------------------

export function executeMindControlForceDiscard(
  state: GameState,
  controllerId: string,
  cardIndices: number[]
): { state: GameState; error?: string } {
  if (!state.mindControlPayloadActive || state.mindControlAttackerId !== controllerId) {
    return { state, error: 'You are not controlling this turn.' };
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer) {
    return { state, error: 'No active player found.' };
  }

  if (cardIndices.length < 1 || cardIndices.length > 3) {
    return { state, error: 'Select 1, 2, or 3 cards to force-discard.' };
  }

  const controller = state.players.find((p) => p.id === controllerId);
  const victimTeam = activePlayer.team;
  const currentHand = victimTeam === 'A' ? [...state.handA] : [...state.handB];
  const deck = [...state.deck];
  const cemetery = [...state.cemetery];

  const sortedIndices = [...new Set(cardIndices)].sort((a, b) => b - a);
  for (const idx of sortedIndices) {
    if (idx < 0 || idx >= currentHand.length) {
      return { state, error: 'Invalid card index.' };
    }
  }

  const discarded: Card[] = [];
  for (const idx of sortedIndices) {
    discarded.push(currentHand[idx]);
    currentHand.splice(idx, 1);
  }
  cemetery.push(...discarded);

  while (currentHand.length < 3 && deck.length > 0) {
    currentHand.push(deck.pop()!);
  }

  const updatedPlayers = state.players.map((p) => {
    if (p.id === activePlayer.id) {
      return { ...p, roundPoints: p.roundPoints + 10 };
    }
    return p;
  });

  const intermediateState: GameState = {
    ...state,
    deck,
    cemetery,
    handA: victimTeam === 'A' ? currentHand : state.handA,
    handB: victimTeam === 'B' ? currentHand : state.handB,
    players: updatedPlayers,
    mindControlPayloadActive: false,
    mindControlAttackerId: undefined,
    mindControlTargetPlayerId: undefined,
    lastActionMessage: `MIND CONTROL! ${controller?.name || 'Controller'} seized ${activePlayer.name}'s turn and forced them to discard ${discarded.length} card(s) to the cemetery (+10 pts)!`,
    updatedAt: Date.now(),
  };

  return { state: passActiveTurnSequence(intermediateState) };
}

export function executeMindControlForceGuess(
  state: GameState,
  controllerId: string,
  forcedSuit: Suit
): { state: GameState; isCorrect: boolean; error?: string } {
  if (!state.mindControlPayloadActive || state.mindControlAttackerId !== controllerId) {
    return { state, isCorrect: false, error: 'You are not controlling this turn.' };
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer) {
    return { state, isCorrect: false, error: 'No active player found.' };
  }

  if (state.deactivatedSuits.includes(forcedSuit)) {
    return { state, isCorrect: false, error: 'This suit is already eliminated.' };
  }

  const controller = state.players.find((p) => p.id === controllerId);

  // Clear mind control state first so guessSuitAction can pass turn without re-triggering
  const disarmedState: GameState = {
    ...state,
    mindControlPayloadActive: false,
    mindControlAttackerId: undefined,
    mindControlTargetPlayerId: undefined,
  };

  const result = guessSuitAction(disarmedState, activePlayer.id, forcedSuit);

  result.state.lastActionMessage = `MIND CONTROL! ${controller?.name || 'Controller'} forced ${activePlayer.name} to guess ${forcedSuit}! ${
    result.isCorrect ? 'Correct! Round Over!' : 'Wrong guess! Deducted -30 pts and eliminated suit.'
  }`;

  return result;
}
