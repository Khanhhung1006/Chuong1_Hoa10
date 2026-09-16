import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Undo2 } from 'lucide-react';
import { ToastMessage } from '../../types';

export interface SnackbarProps {
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
  // Alternative single-toast API used by App.tsx
  message?: string;
  type?: 'success' | 'info' | 'error' | 'warning';
  isVisible?: boolean;
  onClose?: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  toasts,
  onDismiss,
  message,
  type = 'info',
  isVisible = false,
  onClose,
}) => {
  // Auto-dismiss single toast
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, message]);

  // Single-toast mode
  if (message !== undefined || isVisible !== undefined) {
    const isSuccess = type === 'success';
    const isError = type === 'error';
    const isWarning = type === 'warning';

    return (
      <div
        id="snackbar-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4"
      >
        <AnimatePresence>
          {isVisible && message && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                isSuccess
                  ? 'bg-slate-900/90 text-white border-emerald-500/40 shadow-emerald-500/10'
                  : isError
                  ? 'bg-rose-950/90 text-white border-rose-500/40 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-amber-950/90 text-white border-amber-500/40 shadow-amber-500/10'
                  : 'bg-slate-900/90 text-white border-cyan-500/40 shadow-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
                <p className="text-sm font-medium leading-snug truncate">{message}</p>
              </div>

              {onClose && (
                <button
                  id="toast-close-btn"
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Multi-toast mode
  const toastList = Array.isArray(toasts) ? toasts : [];

  return (
    <div
      id="snackbar-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4"
    >
      <AnimatePresence>
        {toastList.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                isSuccess
                  ? 'bg-slate-900/90 text-white border-emerald-500/40 shadow-emerald-500/10'
                  : isError
                  ? 'bg-rose-950/90 text-white border-rose-500/40 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-amber-950/90 text-white border-amber-500/40 shadow-amber-500/10'
                  : 'bg-slate-900/90 text-white border-cyan-500/40 shadow-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
                <p className="text-sm font-medium leading-snug truncate">{toast.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {toast.actionLabel && toast.onAction && (
                  <button
                    id={`toast-action-${toast.id}`}
                    onClick={() => {
                      toast.onAction?.();
                      onDismiss?.(toast.id);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    {toast.actionLabel}
                  </button>
                )}
                {onDismiss && (
                  <button
                    id={`toast-close-${toast.id}`}
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

