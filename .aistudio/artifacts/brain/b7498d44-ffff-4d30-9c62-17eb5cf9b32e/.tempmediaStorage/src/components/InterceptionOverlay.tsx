import React from 'react';
import type { InterceptionNotification } from '../game/types.ts';

interface InterceptionOverlayProps {
  notification: InterceptionNotification | null;
  onDismiss: () => void;
  fatedGlimpseSuit: string | null;
  onDismissFatedGlimpse: () => void;
  mindControlHackedMessage: string | null;
}

export const InterceptionOverlay: React.FC<InterceptionOverlayProps> = ({
  notification,
  onDismiss,
  fatedGlimpseSuit,
  onDismissFatedGlimpse,
  mindControlHackedMessage,
}) => {
  return (
    <>
      {/* Post-Turn Firewall / Shield Interception Alert */}
      {notification && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border-2 shadow-2xl font-mono text-center ${
              notification.type === 'TACTICAL_ERROR'
                ? 'bg-red-950/90 border-red-500 text-red-200'
                : 'bg-purple-950/90 border-purple-400 text-purple-200'
            }`}
          >
            <div className="text-3xl mb-3">
              {notification.type === 'TACTICAL_ERROR' ? '⚠️' : '🛡️'}
            </div>
            <h3 className="text-base font-bold tracking-widest uppercase mb-2">
              {notification.type === 'TACTICAL_ERROR'
                ? 'SECURITY INTERCEPTION'
                : 'DEFENSIVE FIREWALL ENGAGED'}
            </h3>
            <p className="text-sm font-semibold mb-6 leading-relaxed">
              {notification.message}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-widest cursor-pointer ${
                notification.type === 'TACTICAL_ERROR'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

      {/* Fated Glimpse Local Alert Modal */}
      {fatedGlimpseSuit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-center font-mono">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-xl mb-3 text-amber-300">
              👁️
            </div>
            <h3 className="text-sm font-bold text-amber-400 tracking-widest uppercase mb-1">
              FATED GLIMPSE // DECK VECTOR PEEK
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Top card of the deck has been surveyed privately:
            </p>

            <div className="py-4 px-6 bg-black border border-neutral-800 rounded-xl my-3">
              <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">
                TOP DECK SUIT
              </span>
              <span className="text-2xl font-black text-amber-300">
                {fatedGlimpseSuit}
              </span>
            </div>

            <p className="text-[10px] text-neutral-500 mb-4">
              This information is stored only in your local client memory.
            </p>

            <button
              type="button"
              onClick={onDismissFatedGlimpse}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer"
            >
              Close Vision
            </button>
          </div>
        </div>
      )}

      {/* Mind Control Local Hacked Interception Overlay */}
      {mindControlHackedMessage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border-2 border-red-600 rounded-2xl p-6 shadow-2xl text-center font-mono animate-pulse">
            <div className="text-3xl text-red-500 mb-2">☠️</div>
            <h3 className="text-base font-black text-red-500 tracking-widest uppercase mb-2">
              [SYSTEM COMPROMISED: MIND CONTROL TRAP]
            </h3>
            <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
              Your neural control interface was hijacked by enemy espionage!
            </p>
            <div className="p-3 bg-red-950/60 border border-red-500 rounded text-xs text-red-200 font-bold mb-4">
              {mindControlHackedMessage}
            </div>
            <p className="text-[10px] text-neutral-500">
              Forced execution registered. Network packet transmitted.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
