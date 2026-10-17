import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDeck,
  calculateRating,
  startNewRound,
  createInitialState,
  revealCardsAction,
  guessSuitAction,
  equalizeAndRebalanceMatrix,
  executeOutlawAbility,
  passActiveTurnSequence,
  executeMindControlForceDiscard,
  executeMindControlForceGuess,
} from './rules.ts';
import type { Player, GameState, Suit } from './types.ts';

function createMockPlayers(): Player[] {
  return [
    { id: 'pA1', name: 'Alpha 1', team: 'A', slot: 0, rating: 100, roundPoints: 0 },
    { id: 'pB1', name: 'Beta 1', team: 'B', slot: 1, rating: 80, roundPoints: 0 },
    { id: 'pA2', name: 'Alpha 2', team: 'A', slot: 2, rating: 60, roundPoints: 0 },
    { id: 'pB2', name: 'Beta 2', team: 'B', slot: 3, rating: 40, roundPoints: 0 },
  ];
}

test('Deck mathematics: exactly 15 cards, 5 suits, 3 per suit', () => {
  const deck = createDeck();
  assert.equal(deck.length, 15);

  const suitCounts: Record<string, number> = {};
  for (const card of deck) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }

  assert.equal(suitCounts['SPADES'], 3);
  assert.equal(suitCounts['HEARTS'], 3);
  assert.equal(suitCounts['DIAMONDS'], 3);
  assert.equal(suitCounts['CLUBS'], 3);
  assert.equal(suitCounts['DEMON'], 3);
});

test('Round initialization: pops targetCard, deals 3 to each team, leaves 8 in deck', () => {
  const base = createInitialState('TEST');
  base.players = createMockPlayers();
  const state = startNewRound(base);

  assert.notEqual(state.targetCard, null);
  assert.equal(state.handA.length, 3);
  assert.equal(state.handB.length, 3);
  assert.equal(state.deck.length, 8);
  assert.equal(state.cemetery.length, 0);
  assert.equal(state.rotation.length, 4);
  assert.equal(state.currentTurnIndex, 0);
});

test('Recency weight formula: (points * 0.7) + (prevRating * 0.3)', () => {
  const rating1 = calculateRating(50, 100);
  assert.equal(rating1, 65);

  const rating2 = calculateRating(10, 0);
  assert.equal(rating2, 7);
});

test('Reveal selection action: moves 1-3 cards to cemetery, active player +10 pts, passes turn', () => {
  const base = createInitialState('TEST');
  base.players = createMockPlayers();
  const state = startNewRound(base);

  const initialHandACard = state.handA[0];
  const activePlayerId = state.rotation[state.currentTurnIndex]; // 'pA1'
  assert.equal(activePlayerId, 'pA1');

  const result = revealCardsAction(state, 'pA1', [0]);
  assert.equal(result.error, undefined);

  const pA1 = result.state.players.find((p) => p.id === 'pA1');
  assert.equal(pA1?.roundPoints, 10);

  assert.equal(result.state.cemetery.length, 1);
  assert.equal(result.state.cemetery[0].id, initialHandACard.id);
  assert.equal(result.state.handA.length, 3);

  // Turn passed to Team B Player 1 ('pB1')
  assert.equal(result.state.currentTurnIndex, 1);
  assert.equal(result.state.rotation[result.state.currentTurnIndex], 'pB1');
});

test('Incorrect suit guess: -30 pts to active player, suit deactivated globally, turn passed', () => {
  const base = createInitialState('TEST');
  base.players = createMockPlayers();
  const state = startNewRound(base);

  const targetSuit = state.targetCard!.suit;
  const wrongSuit: Suit = targetSuit === 'SPADES' ? 'HEARTS' : 'SPADES';

  const result = guessSuitAction(state, 'pA1', wrongSuit);
  assert.equal(result.isCorrect, false);
  assert.equal(result.state.phase, 'PLAYING');

  const pA1 = result.state.players.find((p) => p.id === 'pA1');
  assert.equal(pA1?.roundPoints, -30);

  assert.ok(result.state.deactivatedSuits.includes(wrongSuit));
  assert.equal(result.state.currentTurnIndex, 1);
});

test('Correct suit guess: match ends instantly, +50 to BOTH teammates, rating calculated', () => {
  const base = createInitialState('TEST');
  base.players = createMockPlayers();
  const state = startNewRound(base);

  const targetSuit = state.targetCard!.suit;
  const result = guessSuitAction(state, 'pA1', targetSuit);

  assert.equal(result.isCorrect, true);
  assert.equal(result.state.phase, 'ROUND_OVER');
  assert.equal(result.state.winnerTeam, 'A');

  const pA1 = result.state.players.find((p) => p.id === 'pA1');
  const pA2 = result.state.players.find((p) => p.id === 'pA2');
  const pB1 = result.state.players.find((p) => p.id === 'pB1');

  assert.equal(pA1?.roundPoints, 50);
  assert.equal(pA2?.roundPoints, 50);
  assert.equal(pB1?.roundPoints, 0);
  assert.equal(pA1?.rating, 65);
});

test('Host equalization rebalance: sorts by rating, Rank 1 & 4 -> Team A, Rank 2 & 3 -> Team B', () => {
  const base = createInitialState('TEST');
  base.players = [
    { id: 'p1', name: 'Ace', team: 'A', slot: 0, rating: 120, roundPoints: 0 },
    { id: 'p2', name: 'Baron', team: 'A', slot: 2, rating: 90, roundPoints: 0 },
    { id: 'p3', name: 'Cipher', team: 'B', slot: 1, rating: 40, roundPoints: 0 },
    { id: 'p4', name: 'Delta', team: 'B', slot: 3, rating: 15, roundPoints: 0 },
  ];

  const equalized = equalizeAndRebalanceMatrix(base);

  const ace = equalized.players.find((p) => p.id === 'p1');
  const delta = equalized.players.find((p) => p.id === 'p4');
  const baron = equalized.players.find((p) => p.id === 'p2');
  const cipher = equalized.players.find((p) => p.id === 'p3');

  assert.equal(ace?.team, 'A');
  assert.equal(delta?.team, 'A');
  assert.equal(baron?.team, 'B');
  assert.equal(cipher?.team, 'B');
});

test('Akuma Cataclysmic Swap: swaps hands across teams', () => {
  const base = createInitialState('TEST');
  base.gameMode = 'AKUMA';
  base.players = createMockPlayers();
  base.players[0].ability = 'CATACLYSMIC_SWAP';
  base.players[0].abilityUsed = false;

  const state = startNewRound(base);
  state.players[0].ability = 'CATACLYSMIC_SWAP';
  state.players[0].abilityUsed = false;

  const initialHandA = [...state.handA];
  const initialHandB = [...state.handB];

  const result = executeOutlawAbility(state, 'pA1', 'CATACLYSMIC_SWAP');
  assert.equal(result.error, undefined);
  assert.deepEqual(result.state.handA, initialHandB);
  assert.deepEqual(result.state.handB, initialHandA);
});

test('Akuma No Distractions: intercepts Cemetery Blackout and generates alerts', () => {
  const base = createInitialState('TEST');
  base.gameMode = 'AKUMA';
  base.players = createMockPlayers();
  base.players[0].ability = 'CEMETERY_BLACKOUT';
  base.players[0].abilityUsed = false;
  base.players[1].ability = 'NO_DISTRACTIONS';
  base.players[1].abilityUsed = false;

  const state = startNewRound(base);
  state.players[0].ability = 'CEMETERY_BLACKOUT';
  state.players[0].abilityUsed = false;
  state.players[1].ability = 'NO_DISTRACTIONS';
  state.players[1].abilityUsed = false;

  const result = executeOutlawAbility(state, 'pA1', 'CEMETERY_BLACKOUT');
  assert.equal(result.state.blackoutCounter, 0); // nullified!
  assert.ok(result.attackerAlert?.includes('No Distractions'));
  assert.ok(result.defenderAlert?.message.includes('No Distractions'));
});

test('Akuma Dark Transmission: activates for active team and auto-purges on turn pass', () => {
  const base = createInitialState('TEST');
  base.gameMode = 'AKUMA';
  base.players = createMockPlayers();
  const state = startNewRound(base);
  state.players[0].ability = 'DARK_TRANSMISSION';
  state.players[0].abilityUsed = false;

  const res = executeOutlawAbility(state, 'pA1', 'DARK_TRANSMISSION');
  assert.equal(res.state.darkTransmissionActive, true);
  assert.equal(res.state.darkTransmissionTeam, 'A');

  // Pass turn: closed and memory wiped
  const passed = passActiveTurnSequence(res.state);
  assert.equal(passed.darkTransmissionActive, false);
  assert.equal(passed.darkTransmissionTeam, null);
  assert.equal(passed.commsHistory.length, 0);
});

test('Akuma Mind Control: arms against next opponent and gives controller full command', () => {
  const base = createInitialState('TEST');
  base.gameMode = 'AKUMA';
  base.players = createMockPlayers();
  const state = startNewRound(base);
  state.players[0].ability = 'MIND_CONTROL';
  state.players[0].abilityUsed = false;
  state.players[1].ability = 'DEVILS_MONOCLE';
  state.players[1].abilityUsed = false;
  state.players[3].ability = 'FATED_GLIMPSE';
  state.players[3].abilityUsed = false;

  // pA1 triggers Mind Control. Next in rotation is pB1 (Team B)
  const res = executeOutlawAbility(state, 'pA1', 'MIND_CONTROL');
  assert.equal(res.state.mindControlPayloadActive, true);
  assert.equal(res.state.mindControlAttackerId, 'pA1');
  assert.equal(res.state.mindControlTargetPlayerId, 'pB1');

  // Turn advances to victim pB1
  const victimState = passActiveTurnSequence(res.state);
  assert.equal(victimState.currentTurnIndex, 1);
  assert.equal(victimState.rotation[1], 'pB1');
  assert.equal(victimState.mindControlPayloadActive, true);

  // Controller pA1 forces pB1 to discard card at index 0
  const initialHandB0 = victimState.handB[0];
  const controlledResult = executeMindControlForceDiscard(victimState, 'pA1', [0]);
  assert.equal(controlledResult.error, undefined);
  assert.equal(controlledResult.state.mindControlPayloadActive, false);
  assert.equal(controlledResult.state.cemetery.length, 1);
  assert.equal(controlledResult.state.cemetery[0].id, initialHandB0.id);
  // Turn automatically passes to next player (pA2)
  assert.equal(controlledResult.state.currentTurnIndex, 2);
});
