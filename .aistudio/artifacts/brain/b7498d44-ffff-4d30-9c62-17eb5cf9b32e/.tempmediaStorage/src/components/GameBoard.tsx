import React, { useState } from 'react';
import type { GameState, Suit, Team } from '../game/types.ts';
import { SUITS } from '../game/types.ts';
import { CardView } from './CardView.tsx';
import { CemeteryView } from './CemeteryView.tsx';
import { OutlawRail } from './OutlawRail.tsx';
import { DeductionTracker } from './DeductionTracker.tsx';
import { RulesGuideModal } from './RulesGuideModal.tsx';
import { ExitRoomModal } from './ExitRoomModal.tsx';
import { MindControlControllerModal } from './MindControlControllerModal.tsx';
import { soundEffects } from '../utils/soundEffects.ts';

interface GameBoardProps {
  state: GameState;
  currentUserId: string;
  onRevealSelected: (cardIndices: number[]) => void;
  onGuessSuit: (suit: Suit) => void;
  onExecuteAbility: (abilityId: string) => void;
  onMindControlForceDiscard?: (cardIndices: number[]) => void;
  onMindControlForceGuess?: (suit: Suit) => void;
  whisperedEliminationSuit: Suit | null;
  devilsMonocleActive: boolean;
  onSwitchSeatTest: (newPlayerId: string) => void;
  onExitRoom: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  currentUserId,
  onRevealSelected,
  onGuessSuit,
  onExecuteAbility,
  onMindControlForceDiscard,
  onMindControlForceGuess,
  whisperedEliminationSuit,
  devilsMonocleActive,
  onSwitchSeatTest,
  onExitRoom,
}) => {
  // Screen Mask: default to false or toggleable for privacy in physical room
  const [screenMask, setScreenMask] = useState<boolean>(false);

  // Local card selection
  const [localSelectedIndices, setLocalSelectedIndices] = useState<number[]>([]);

  // Modals
  const [isDeductionTrackerOpen, setIsDeductionTrackerOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());

  const activePlayerId = state.rotation[state.currentTurnIndex];
  const activePlayer = state.players.find((p) => p.id === activePlayerId);
  const currentPlayer = state.players.find((p) => p.id === currentUserId);
  const isMyTurn = activePlayerId === currentUserId;

  const myTeam: Team = currentPlayer?.team || 'A';
  const enemyTeam: Team = myTeam === 'A' ? 'B' : 'A';

  const myHand = myTeam === 'A' ? state.handA : state.handB;
  const enemyHand = enemyTeam === 'A' ? state.handA : state.handB;

  // Devil's Monocle: ONLY the active player who activated it on their own turn can see enemy cards!
  const canSeeEnemyHandViaMonocle = Boolean(
    devilsMonocleActive && isMyTurn && currentUserId === activePlayerId
  );

  const isCemeteryBlackoutActive =
    state.blackoutCounter > 0 && state.blackoutTeamTarget === myTeam;

  // Mind Control state
  const isMindControlTurnActive =
    state.mindControlPayloadActive && activePlayerId === state.mindControlTargetPlayerId;
  const isMindController =
    isMindControlTurnActive && currentUserId === state.mindControlAttackerId;
  const isMindControlVictim =
    isMindControlTurnActive && currentUserId === state.mindControlTargetPlayerId;

  const mindControllerPlayer = state.players.find(
    (p) => p.id === state.mindControlAttackerId
  );

  const toggleSelectCard = (index: number) => {
    if (!isMyTurn || isMindControlVictim) return;

    soundEffects.playCardSelect();
    setLocalSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, index];
      }
    });
  };

  const handleMaskToggle = () => {
    soundEffects.playCardFlip();
    setScreenMask(!screenMask);
  };

  const handleReveal = () => {
    if (!isMyTurn || isMindControlVictim) return;
    if (localSelectedIndices.length < 1 || localSelectedIndices.length > 3) return;

    soundEffects.playRevealAction();
    onRevealSelected(localSelectedIndices);
    setLocalSelectedIndices([]);
  };

  const handleSuitGuessClick = (suit: Suit) => {
    if (!isMyTurn || isMindControlVictim) return;
    onGuessSuit(suit);
  };

  const toggleMute = () => {
    const updated = soundEffects.toggleMute();
    setIsMuted(updated);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 font-mono">
      {/* Top Header Bar */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-neutral-800 text-neutral-200 px-2.5 py-1 rounded-lg font-bold">
            ROOM: {state.room}
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg">
            ROUND {state.roundNumber}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
              state.gameMode === 'AKUMA'
                ? 'bg-amber-400 text-black'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {state.gameMode}
          </span>
        </div>

        {/* Tools: Deduction Matrix, How to Play, Mute, Exit Room */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDeductionTrackerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <span>📊</span>
            <span>DEDUCTION MATRIX</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-bold cursor-pointer transition-colors"
          >
            <span>📜</span>
            <span className="hidden sm:inline">RULES</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs cursor-pointer transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* EXIT ROOM BUTTON */}
          <button
            type="button"
            onClick={() => setIsExitModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-200 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <span>🚪</span>
            <span>EXIT ROOM</span>
          </button>
        </div>

        {/* Test Seat Switcher (for multi-seat local testing) */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-[11px] text-neutral-500 hidden md:inline">TEST SEAT:</span>
          <select
            value={currentUserId}
            onChange={(e) => onSwitchSeatTest(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-amber-400"
          >
            {state.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Team {p.team} - Seat {p.slot + 1})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Player Turn Rotation Bar */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 mb-3 shadow-md">
        <div className="grid grid-cols-4 gap-2">
          {state.rotation.map((pId, idx) => {
            const player = state.players.find((p) => p.id === pId);
            const isTurn = idx === state.currentTurnIndex;
            const isTeamA = player?.team === 'A';
            const isSelf = player?.id === currentUserId;

            return (
              <div
                key={pId}
                className={`p-2 rounded-xl text-center border transition-all ${
                  isTurn
                    ? isTeamA
                      ? 'bg-red-950/80 border-red-500 ring-2 ring-red-500/50 shadow-lg'
                      : 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg'
                    : 'bg-[#181818] border-neutral-800/70 opacity-65'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 text-[10px] font-bold">
                  <span className={isTeamA ? 'text-red-400' : 'text-cyan-400'}>
                    TEAM {player?.team} P{(player?.slot !== undefined ? (player.slot % 2) + 1 : 1)}
                  </span>
                  {isTurn && (
                    <span className="text-amber-400 font-mono text-[9px] font-extrabold animate-pulse">
                      ● ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-neutral-200 truncate mt-0.5">
                  {player?.name || `Seat ${idx + 1}`}
                  {isSelf && ' (You)'}
                </div>
                <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                  Score: {player?.roundPoints || 0} · Rating: {player?.rating || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Turn Action Guidance Banner */}
      <div
        className={`mb-3 p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 transition-all ${
          isMindControlTurnActive
            ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md animate-pulse'
            : isMyTurn
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{isMindControlTurnActive ? '🧠' : isMyTurn ? '👉' : '⏳'}</span>
          <div>
            <strong className="text-white mr-2">
              {isMindControlTurnActive
                ? `MIND CONTROL ACTIVE: ${mindControllerPlayer?.name || 'Controller'} controls ${activePlayer?.name}'s turn!`
                : isMyTurn
                ? 'YOUR TURN:'
                : `${activePlayer?.name}'s TURN:`}
            </strong>
            <span className="text-[11px]">
              {isMindControlTurnActive
                ? isMindController
                  ? 'Use the Mind Control modal to dictate their discard or suit guess!'
                  : isMindControlVictim
                  ? 'Your controls are hijacked! Awaiting their command...'
                  : `${mindControllerPlayer?.name} is deciding ${activePlayer?.name}'s action.`
                : isMyTurn
                ? 'Select 1–3 cards to Reveal (+10 pts) OR Guess the secret Target Suit!'
                : 'Waiting for player to take action...'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="text-emerald-400">Reveal: +10 pts</span>
          <span>·</span>
          <span className="text-amber-400">Win: +50 pts</span>
          <span>·</span>
          <span className="text-red-400">Miss: -30 pts</span>
        </div>
      </div>

      {/* Quick Live Deduction Pips Bar (Instant visibility for new players!) */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 mb-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase text-amber-400">
              LIVE DEDUCTION TRACKER
            </span>
            <span className="text-[10px] text-neutral-500">
              (3 Cards per suit · If all 3 seen, suit is ruled out!)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDeductionTrackerOpen(true)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            Detailed View ↗
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {SUITS.map((s) => {
            const inHand = myHand.filter((c) => c.suit === s.suit).length;
            const inCemetery = state.cemetery.filter((c) => c.suit === s.suit).length;
            const totalSeen = inHand + inCemetery;
            const isDeactivated = state.deactivatedSuits.includes(s.suit);
            const isRuledOut = totalSeen >= 3 || isDeactivated;

            return (
              <div
                key={s.suit}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isRuledOut
                    ? 'bg-neutral-950 border-neutral-900 opacity-40 line-through'
                    : 'bg-[#181818] border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 text-sm font-bold text-neutral-200 mb-1">
                  <span>{s.symbol}</span>
                  <span className="text-xs uppercase">{s.name}</span>
                </div>
                <div className="flex items-center justify-center space-x-1 text-xs">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={
                        i < totalSeen
                          ? 'text-amber-400 font-black'
                          : 'text-neutral-700'
                      }
                    >
                      ●
                    </span>
                  ))}
                </div>
                <div className="text-[9px] mt-1 font-mono font-bold">
                  {isRuledOut ? (
                    <span className="text-red-400">RULED OUT</span>
                  ) : (
                    <span className="text-neutral-400">{totalSeen}/3 Seen</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Target Suit Candidates Summary */}
        <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-400 font-semibold">Candidate Suits in Vault:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SUITS.filter((s) => {
                const inHand = myHand.filter((c) => c.suit === s.suit).length;
                const inCemetery = state.cemetery.filter((c) => c.suit === s.suit).length;
                const isDeactivated = state.deactivatedSuits.includes(s.suit);
                return inHand + inCemetery < 3 && !isDeactivated;
              }).map((s) => (
                <span
                  key={s.suit}
                  className="px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/40 text-amber-300 font-bold"
                >
                  {s.symbol} {s.name}
                </span>
              ))}
            </div>
          </div>
          <span className="text-neutral-500 text-[10px]">
            {
              SUITS.filter((s) => {
                const inHand = myHand.filter((c) => c.suit === s.suit).length;
                const inCemetery = state.cemetery.filter((c) => c.suit === s.suit).length;
                const isDeactivated = state.deactivatedSuits.includes(s.suit);
                return inHand + inCemetery < 3 && !isDeactivated;
              }).length
            }{' '}
            possible suits remaining
          </span>
        </div>
      </div>

      {/* Main Board Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Center Game Board */}
        <div className="flex-1 w-full space-y-3">
          {/* Target Card & Enemy Hand */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Target Card Vault */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-black/80 border border-amber-500/40 rounded-2xl relative overflow-hidden shadow-xl">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold mb-1.5">
                  SECRET TARGET CARD
                </span>

                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-2xl flex items-center justify-center bg-black vault-float">
                  <img
                    src="/src/assets/images/akuma_target_vault_1792175811773.jpg"
                    alt="Target Card Vault"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col items-center justify-end pb-1.5 pointer-events-none">
                    <span className="text-[10px] font-bold text-amber-300 font-mono tracking-wider">
                      LOCKED VAULT
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 text-center">
                  <span className="text-[10px] font-bold text-amber-400 font-mono">
                    Deduce this Suit to Win!
                  </span>
                </div>
              </div>

              {/* Enemy Hand */}
              <div className="flex-1 w-full flex flex-col items-center sm:items-end">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs uppercase tracking-widest text-neutral-300 font-bold">
                    TEAM {enemyTeam} HAND
                  </span>
                  {canSeeEnemyHandViaMonocle && (
                    <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                      DEVIL&apos;S MONOCLE (YOUR EYE ONLY)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {enemyHand.map((card, idx) => (
                    <CardView
                      key={`enemy-card-${idx}`}
                      card={canSeeEnemyHandViaMonocle ? card : null}
                      masked={!canSeeEnemyHandViaMonocle}
                      team={enemyTeam}
                      size="sm"
                      label={`Card ${idx + 1}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1.5">
                  {canSeeEnemyHandViaMonocle
                    ? "Visible only to you for this turn. Teammates remain blind."
                    : 'Opponents cards are hidden'}
                </span>
              </div>
            </div>
          </div>

          {/* Cemetery View */}
          <CemeteryView
            cemetery={state.cemetery}
            isBlackoutActive={isCemeteryBlackoutActive}
          />

          {/* Your Team's Hand */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-widest text-neutral-200 font-bold">
                  YOUR HAND (TEAM {myTeam})
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    myTeam === 'A'
                      ? 'bg-red-950 text-red-300 border border-red-500/30'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  3 Cards Shared with Partner
                </span>
              </div>

              {/* Privacy Screen Mask Toggle */}
              <button
                type="button"
                onClick={handleMaskToggle}
                className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl border border-neutral-700 cursor-pointer flex items-center space-x-1.5 transition-colors"
              >
                <span>{screenMask ? '👁️ SHOW CARDS' : '🙈 HIDE CARDS'}</span>
              </button>
            </div>

            {/* Hand Cards */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-2">
              {myHand.map((card, idx) => {
                const isSelected = localSelectedIndices.includes(idx);
                return (
                  <div key={`my-card-${idx}`} className="relative card-deal-anim">
                    <CardView
                      card={card}
                      masked={screenMask}
                      team={myTeam}
                      selected={isSelected}
                      onClick={() => toggleSelectCard(idx)}
                      disabled={!isMyTurn || isMindControlVictim}
                      size="md"
                      label={`Card ${idx + 1}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-500">
              <span>
                {screenMask
                  ? 'Cards are hidden. Tap [SHOW CARDS] to view.'
                  : isMyTurn
                  ? 'Tap 1 to 3 cards to select for revealing to the Cemetery.'
                  : 'Your hand is shared with your teammate.'}
              </span>
              {state.deck.length > 0 && (
                <span className="text-neutral-400 font-mono">
                  Draw Deck: {state.deck.length} cards left
                </span>
              )}
            </div>
          </div>

          {/* Action Area: Reveal & Guess */}
          <div className="bg-[#161616] border-2 border-neutral-700 rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                YOUR TURN ACTIONS
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                  isMyTurn && !isMindControlVictim
                    ? 'bg-amber-400 text-black animate-pulse'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {isMyTurn && !isMindControlVictim
                  ? 'YOUR ACTION REQUIRED'
                  : 'WAITING FOR YOUR TURN'}
              </span>
            </div>

            {/* Option A: Reveal Cards Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleReveal}
                disabled={!isMyTurn || localSelectedIndices.length === 0 || isMindControlVictim}
                className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest border transition-all ${
                  isMyTurn && localSelectedIndices.length > 0 && !isMindControlVictim
                    ? 'bg-neutral-100 text-black border-white hover:bg-white cursor-pointer shadow-lg'
                    : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                }`}
              >
                {localSelectedIndices.length > 0
                  ? `Reveal Selected ${localSelectedIndices.length} Card(s) to Cemetery (+10 pts & Draw Replacements)`
                  : 'Select 1–3 Cards from your hand above to Reveal (+10 pts)'}
              </button>
            </div>

            {/* Option B: Deduce Target Suit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                  OR DEDUCE TARGET SUIT (+50 PTS TO TEAM / -30 PTS PENALTY)
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {SUITS.map((item) => {
                  const inHand = myHand.filter((c) => c.suit === item.suit).length;
                  const inCemetery = state.cemetery.filter((c) => c.suit === item.suit).length;
                  const totalSeen = inHand + inCemetery;
                  const isDeactivated = state.deactivatedSuits.includes(item.suit);
                  const isRuledOut = totalSeen >= 3 && !isDeactivated;
                  const isWhispered = whisperedEliminationSuit === item.suit;

                  return (
                    <button
                      key={item.suit}
                      type="button"
                      onClick={() => handleSuitGuessClick(item.suit)}
                      disabled={!isMyTurn || isDeactivated || isMindControlVictim}
                      className={`h-16 sm:h-20 rounded-xl flex flex-col items-center justify-center p-1.5 border font-mono transition-all relative ${
                        isDeactivated
                          ? 'bg-neutral-950 border-neutral-900 text-neutral-700 cursor-not-allowed line-through opacity-35'
                          : isWhispered
                          ? 'bg-neutral-900 text-amber-300 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer'
                          : isRuledOut
                          ? 'bg-neutral-950/70 border-neutral-800 text-neutral-500 opacity-60'
                          : isMyTurn && !isMindControlVictim
                          ? 'bg-neutral-900 border-neutral-700 hover:border-amber-400 hover:bg-neutral-800 text-neutral-100 cursor-pointer hover:scale-102 transition-transform shadow-md'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{item.symbol}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight mt-1">
                        {item.name}
                      </span>
                      {isDeactivated && (
                        <span className="absolute inset-0 flex items-center justify-center text-red-600 text-2xl font-black">
                          ✕
                        </span>
                      )}
                      {isRuledOut && (
                        <span className="absolute top-1 right-1 text-[8px] bg-red-950 text-red-400 px-1 rounded border border-red-800 font-bold">
                          3/3 SEEN
                        </span>
                      )}
                      {isWhispered && (
                        <span className="absolute -top-2 -right-1 text-[8px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-bold">
                          SAFE!
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between">
                <span>Wrong guess eliminates that suit globally and passes turn.</span>
                <span className="text-red-400 font-semibold">-30 pts penalty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Akuma Power Dashboard */}
        <OutlawRail
          gameMode={state.gameMode}
          player={currentPlayer}
          isActiveTurn={isMyTurn && !isMindControlVictim}
          onExecuteAbility={onExecuteAbility}
        />
      </div>

      {/* Action Notification Strip */}
      {state.lastActionMessage && (
        <div className="mt-3 p-2.5 bg-[#121212] border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 text-center shadow-sm">
          <span className="text-amber-400 font-bold mr-1.5">● GAME LOG:</span>
          {state.lastActionMessage}
        </div>
      )}

      {/* Deduction Matrix Modal */}
      <DeductionTracker
        state={state}
        myHand={myHand}
        isOpen={isDeductionTrackerOpen}
        onClose={() => setIsDeductionTrackerOpen(false)}
      />

      {/* Rules Guide Modal */}
      <RulesGuideModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Exit Room Confirmation Modal */}
      <ExitRoomModal
        isOpen={isExitModalOpen}
        roomId={state.room}
        onConfirm={() => {
          setIsExitModalOpen(false);
          onExitRoom();
        }}
        onCancel={() => setIsExitModalOpen(false)}
      />

      {/* Interactive Mind Control Modal */}
      {isMindControlTurnActive && (
        <MindControlControllerModal
          isOpen={isMindControlTurnActive}
          isController={isMindController}
          isVictim={isMindControlVictim}
          controllerName={mindControllerPlayer?.name || 'Mind Controller'}
          victimName={activePlayer?.name || 'Controlled Player'}
          victimHand={enemyHand}
          deactivatedSuits={state.deactivatedSuits}
          onForceDiscard={(cardIndices) => {
            if (onMindControlForceDiscard) {
              onMindControlForceDiscard(cardIndices);
            }
          }}
          onForceGuess={(suit) => {
            if (onMindControlForceGuess) {
              onMindControlForceGuess(suit);
            }
          }}
        />
      )}
    </div>
  );
};
