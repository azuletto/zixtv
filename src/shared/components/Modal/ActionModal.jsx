import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ActionModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  showCancel = true,
  danger = false,
  confirmDisabled = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur-sm"
          >
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-zinc-300">{message}</p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
              {showCancel && (
                <button
                  onClick={onClose}
                  className="home-control home-control-hover px-4 py-2 text-sm font-medium text-zinc-200"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                disabled={confirmDisabled}
                className={`rounded-lg border px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger
                    ? 'border-red-500/40 bg-red-600/90 hover:bg-red-600'
                    : 'border-red-500/40 bg-red-600/90 hover:bg-red-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionModal;
