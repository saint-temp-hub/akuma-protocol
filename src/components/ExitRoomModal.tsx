import React from 'react';

interface ExitRoomModalProps {
  isOpen: boolean;
  roomId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitRoomModal: React.FC<ExitRoomModalProps> = ({
  isOpen,
  roomId,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm bg-[#151515] border border-neutral-700 rounded-2xl p-6 shadow-2xl text-neutral-200 text-center animate-in fade-in duration-150">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center text-xl mb-3 text-red-400">
          🚪
        </div>

        <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">
          Exit Room?
        </h3>

        <p className="text-xs text-neutral-400 leading-relaxed mb-6">
          Are you sure you want to exit Room{' '}
          <strong className="text-amber-400 font-mono tracking-widest">{roomId}</strong>?
          Your current session will end and you will return to the main menu.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-red-900/40 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};
