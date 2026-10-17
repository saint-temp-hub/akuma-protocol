import React from 'react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-mono">
      <div className="w-full max-w-xl bg-[#141414] border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="text-base font-black tracking-wider text-amber-400 uppercase">
                HOW TO PLAY AKUMA
              </h3>
              <span className="text-[11px] text-neutral-400">
                4-Player 2v2 Card Deduction Game
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Content Sections */}
        <div className="my-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Objective */}
          <div className="p-3.5 bg-black/60 border border-neutral-800 rounded-xl">
            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
              01. THE WIN CONDITION
            </span>
            <p className="text-neutral-300 leading-relaxed">
              At the start of each round, exactly <strong className="text-amber-300">1 secret card</strong> is sequestered face-down into the Target Card Vault. The goal of the game is to be the first team to correctly deduce its suit:
            </p>
            <div className="flex items-center justify-center space-x-4 my-2.5 py-2 bg-neutral-900/80 rounded-xl text-base sm:text-lg text-white font-bold">
              <span>♠ Spades</span>
              <span>♥ Hearts</span>
              <span>♦ Diamonds</span>
              <span>♣ Clubs</span>
              <span>👿 Demon</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              *All suits are rendered in high-contrast solid black.
            </p>
          </div>

          {/* Deck Mathematics */}
          <div className="p-3.5 bg-black/60 border border-neutral-800 rounded-xl">
            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
              02. DECK MATHEMATICS & DEDUCTION
            </span>
            <p className="text-neutral-300 leading-relaxed">
              The deck has exactly <strong className="text-white">15 cards</strong>: 5 suits × 3 identical cards per suit.
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-neutral-400">
              <div>• 1 Card hidden in the Target Vault.</div>
              <div>• 3 Cards in Team A&apos;s hand (shared between partners).</div>
              <div>• 3 Cards in Team B&apos;s hand (shared between partners).</div>
              <div>• 8 Cards in the draw deck.</div>
              <div className="pt-1.5 text-amber-300 font-semibold">
                💡 Key Rule: Each suit only has 3 cards! If you see all 3 copies across your hand and the cemetery, that suit CANNOT be the secret target card!
              </div>
            </div>
          </div>

          {/* Turn Actions */}
          <div className="p-3.5 bg-black/60 border border-neutral-800 rounded-xl">
            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
              03. ON YOUR TURN
            </span>
            <div className="space-y-2 mt-2">
              <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="font-bold text-neutral-200">
                  Option A: Reveal 1 to 3 Cards (+10 pts)
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Choose 1, 2, or 3 cards from your hand to discard into the Cemetery. You draw fresh cards from the deck to refill your hand. You gain +10 individual round points, and turn passes to the next player.
                </div>
              </div>

              <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="font-bold text-neutral-200">
                  Option B: Deduce the Target Suit
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 space-y-1">
                  <div>
                    <span className="text-emerald-400 font-bold">✓ CORRECT:</span> Match ends immediately! <strong className="text-emerald-300">+50 points</strong> awarded to BOTH teammates!
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">✕ WRONG:</span> You lose <strong className="text-red-400">30 points</strong>, that suit is permanently eliminated, and your turn ends.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Akuma Mode */}
          <div className="p-3.5 bg-black/60 border border-neutral-800 rounded-xl">
            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
              04. AKUMA MODE & UNIQUE POWERS
            </span>
            <p className="text-neutral-300 leading-relaxed mb-2">
              In AKUMA mode, each player receives 1 powerful unique ability per round:
            </p>
            <div className="space-y-1.5 text-[11px] text-neutral-300">
              <div><strong className="text-amber-300">Devil&apos;s Monocle:</strong> Privately see opponent&apos;s cards for 1 turn. Teammates remain blind.</div>
              <div><strong className="text-amber-300">Mind Control:</strong> Arm against next opponent. On their turn, YOU control their action!</div>
              <div><strong className="text-amber-300">Cemetery Blackout:</strong> Blacks out the Cemetery for opponents for 2 turns.</div>
              <div><strong className="text-amber-300">No Distractions:</strong> Passive trap shield. Automatically blocks Mind Control or Blackout.</div>
              <div><strong className="text-amber-300">Dark Transmission:</strong> Opens a private live chat with your teammate during your turn.</div>
              <div><strong className="text-amber-300">Fated Glimpse:</strong> Privately peek at the top card of the draw deck.</div>
              <div><strong className="text-amber-300">Whispered Elimination:</strong> Privately highlights one safe non-target suit.</div>
              <div><strong className="text-amber-300">Cataclysmic Swap:</strong> Forcibly swaps Team A and Team B hands!</div>
            </div>
          </div>

          {/* Silence Rule */}
          <div className="p-3.5 bg-red-950/20 border border-red-900/60 rounded-xl text-[11px]">
            <span className="text-red-400 font-bold uppercase tracking-wider block mb-0.5">
              05. PHYSICAL SILENCE RULE
            </span>
            <p className="text-neutral-300">
              When playing in person, players must maintain absolute silence with zero verbal cues or gestures. Communicate only through the cards you reveal or the encrypted Dark Transmission chat!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-colors"
        >
          Got it! Let&apos;s Play
        </button>
      </div>
    </div>
  );
};
