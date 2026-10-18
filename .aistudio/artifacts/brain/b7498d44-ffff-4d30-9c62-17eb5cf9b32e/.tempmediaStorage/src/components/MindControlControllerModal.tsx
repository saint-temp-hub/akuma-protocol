import React, { useState } from 'react';
import type { Card, Suit } from '../game/types.ts';
import { SUITS } from '../game/types.ts';
import { CardView } from './CardView.tsx';

interface MindControlControllerModalProps {
  isOpen: boolean;
  isController: boolean;
  isVictim: boolean;
  controllerName: string;
  victimName: string;
  victimHand: Card[];
  deactivatedSuits: Suit[];
  onForceDiscard: (cardIndices: number[]) => void;
  onForceGuess: (suit: Suit) => void;
}

export const MindControlControllerModal: React.FC<MindControlControllerModalProps> = ({
  isOpen,
  isController,
  isVictim,
  controllerName,
  victimName,
  victimHand,
  deactivatedSuits,
  onForceDiscard,
  onForceGuess,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [activeTab, setActiveTab] = useState<'DISCARD' | 'GUESS'>('DISCARD');

  if (!isOpen) return null;

  const toggleSelectCard = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleExecuteDiscard = () => {
    if (selectedIndices.length === 0) return;
    onForceDiscard(selectedIndices);
    setSelectedIndices([]);
  };

  const handleExecuteGuess = () => {
    if (!selectedSuit) return;
    onForceGuess(selectedSuit);
    setSelectedSuit(null);
  };

  // If current player is the VICTIM
  if (isVictim) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md bg-[#130f1d] border-2 border-purple-500 rounded-2xl p-6 sm:p-7 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/50 border border-purple-400 flex items-center justify-center text-3xl mb-4 animate-pulse">
            🧠
          </div>
          <h3 className="text-lg font-black tracking-wider text-purple-300 uppercase mb-2">
            YOU ARE MIND CONTROLLED!
          </h3>
          <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
            <strong className="text-amber-400">{controllerName}</strong> has seized complete
            control of your mind for this turn!
          </p>
          <div className="p-3.5 bg-black/60 border border-purple-900/80 rounded-xl text-xs text-purple-200/90 mb-4 flex items-center justify-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></span>
            <span>Awaiting {controllerName}&apos;s forced command...</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Your screen controls are locked. Their command will execute automatically on your turn.
          </p>
        </div>
      </div>
    );
  }

  // If current player is the CONTROLLER
  if (isController) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono">
        <div className="w-full max-w-lg bg-[#14121a] border-2 border-purple-500 rounded-2xl p-5 sm:p-6 shadow-2xl text-neutral-200 my-auto">
          {/* Header */}
          <div className="flex items-center space-x-3 pb-3 border-b border-purple-900/60 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-400 flex items-center justify-center text-xl shrink-0">
              🧠
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wider text-purple-300 uppercase">
                MIND CONTROL: YOU ARE IN COMMAND!
              </h3>
              <p className="text-xs text-neutral-400">
                You control <strong className="text-amber-300">{victimName}</strong>&apos;s turn.
                Dictate their move:
              </p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('DISCARD')}
              className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === 'DISCARD'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Option 1: Force Discard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('GUESS')}
              className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === 'GUESS'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Option 2: Force Suit Guess
            </button>
          </div>

          {/* Tab 1: Force Discard */}
          {activeTab === 'DISCARD' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300">
                Select 1, 2, or 3 cards from {victimName}&apos;s hand to discard into the Cemetery:
              </p>

              <div className="flex items-center justify-center space-x-3 py-2">
                {victimHand.map((card, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={`victim-card-${idx}`}
                      onClick={() => toggleSelectCard(idx)}
                      className={`cursor-pointer transform transition-all ${
                        isSelected ? 'scale-105' : 'hover:scale-102'
                      }`}
                    >
                      <CardView
                        card={card}
                        selected={isSelected}
                        size="md"
                        label={`Card ${idx + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 bg-black/50 p-2.5 rounded-xl border border-neutral-800">
                <span>Selected: {selectedIndices.length} / 3 cards</span>
                <span className="text-emerald-400 font-semibold">+10 pts & replacement draw</span>
              </div>

              <button
                type="button"
                onClick={handleExecuteDiscard}
                disabled={selectedIndices.length === 0}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                  selectedIndices.length > 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                Force {victimName} to Discard Selected Cards
              </button>
            </div>
          )}

          {/* Tab 2: Force Guess */}
          {activeTab === 'GUESS' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300">
                Force {victimName} to guess a suit! If it is wrong,{' '}
                <strong className="text-red-400">{victimName} loses 30 points</strong> and that suit
                is eliminated from the game!
              </p>

              <div className="grid grid-cols-5 gap-2 my-2">
                {SUITS.map((s) => {
                  const isDeactivated = deactivatedSuits.includes(s.suit);
                  const isSelected = selectedSuit === s.suit;
                  return (
                    <button
                      key={s.suit}
                      type="button"
                      disabled={isDeactivated}
                      onClick={() => setSelectedSuit(s.suit)}
                      className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isDeactivated
                          ? 'opacity-30 border-neutral-800 bg-neutral-950 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-purple-400 bg-purple-950/80 text-purple-200 ring-2 ring-purple-400 scale-105'
                          : 'border-neutral-700 bg-neutral-900/80 hover:border-neutral-500 text-neutral-200'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl mb-1">{s.symbol}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 bg-black/50 p-2.5 rounded-xl border border-neutral-800">
                <span>Selected Suit: {selectedSuit || 'None'}</span>
                <span className="text-red-400 font-semibold">-30 pts penalty if wrong</span>
              </div>

              <button
                type="button"
                onClick={handleExecuteGuess}
                disabled={!selectedSuit}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                  selectedSuit
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                Force {victimName} to Guess {selectedSuit || 'Suit'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Observers (other 2 players) see a non-blocking toast
  return null;
};
