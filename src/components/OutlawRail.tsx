import React, { useState } from 'react';
import type { Player } from '../game/types.ts';
import { OUTLAW_ABILITIES } from '../game/types.ts';

interface OutlawRailProps {
  gameMode: 'NORMAL' | 'AKUMA';
  player?: Player;
  isActiveTurn: boolean;
  onExecuteAbility: (abilityId: string) => void;
  disabled?: boolean;
}

export const OutlawRail: React.FC<OutlawRailProps> = ({
  gameMode,
  player,
  isActiveTurn,
  onExecuteAbility,
  disabled = false,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If NORMAL mode, DOM container on the right rail is unmounted
  if (gameMode !== 'AKUMA' || !player) {
    return null;
  }

  const abilityKey = player.ability;
  const abilityDef = abilityKey ? OUTLAW_ABILITIES[abilityKey] : null;
  const isUsed = player.abilityUsed;
  const isPassive = abilityDef?.type === 'PASSIVE';

  return (
    <>
      <div className="w-full lg:w-72 bg-[#141414] border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shrink-0 flex flex-col justify-between shadow-lg relative overflow-hidden">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center space-x-1.5">
              <span className="text-amber-400 text-xs font-mono font-bold tracking-widest uppercase">
                AKUMA POWER
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                1x / ROUND
              </span>
            </div>
            {isUsed && (
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
                USED
              </span>
            )}
          </div>

          <div className="mt-3">
            {abilityDef ? (
              <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-300 font-mono tracking-tight">
                    {abilityDef.name}
                  </h4>
                  {/* Private [i] info button */}
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center text-xs font-mono font-bold cursor-pointer transition-colors"
                    aria-label={`Inspect ${abilityDef.name} info`}
                  >
                    ℹ
                  </button>
                </div>

                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                      isPassive
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isPassive ? 'PASSIVE SHIELD' : 'ACTIVE POWER'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                  {abilityDef.description}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500 text-xs font-mono">
                No power assigned.
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {abilityDef && (
          <div className="mt-4">
            {isPassive ? (
              <div className="text-center py-2.5 px-3 bg-purple-950/30 border border-purple-800/50 rounded-xl">
                <span className="text-xs font-mono text-purple-300 leading-tight block">
                  🛡️ Armed as a passive shield. Triggers automatically if an opponent attacks your team with Mind Control or Cemetery Blackout.
                </span>
              </div>
            ) : isUsed ? (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-neutral-900 border border-neutral-800 text-neutral-600 rounded-xl text-xs font-mono uppercase tracking-widest cursor-not-allowed"
              >
                Power Used This Round
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onExecuteAbility(abilityDef.id)}
                disabled={disabled || !isActiveTurn}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest border transition-all ${
                  isActiveTurn && !disabled
                    ? 'bg-amber-400 text-black border-amber-300 hover:bg-amber-300 cursor-pointer shadow-lg'
                    : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                }`}
              >
                {isActiveTurn ? 'ACTIVATE POWER' : 'WAIT FOR YOUR TURN'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Private client-side modal for [i] info */}
      {showInfoModal && abilityDef && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161616] border border-amber-500/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {abilityDef.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 uppercase">
                  {abilityDef.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                {abilityDef.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="mt-4 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-xl border border-neutral-700 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
