import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="card relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-b-none sm:rounded-2xl"
            initial={{ y: 40, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
              <h2 className="text-base font-semibold">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[hsl(var(--surface-2))]">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">{children}</div>
            {footer && (
              <div className="flex justify-end gap-2 border-t border-[hsl(var(--border))] px-4 py-3 pb-safe">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
