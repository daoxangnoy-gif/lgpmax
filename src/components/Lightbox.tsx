import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { StoryPhoto } from "@/types";

/** ดูรูปใหญ่เต็มจอ + เลื่อนซ้าย/ขวา (คีย์บอร์ด/ปุ่ม) */
export default function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: StoryPhoto[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const open = index !== null && index >= 0 && index < photos.length;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index! > 0) onIndex(index! - 1);
      else if (e.key === "ArrowRight" && index! < photos.length - 1) onIndex(index! + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, photos.length, onClose, onIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/92 pt-safe pb-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* ปิด */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="ปิด"
          >
            <X size={22} />
          </button>

          {/* ก่อนหน้า */}
          {index! > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndex(index! - 1);
              }}
              className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft size={26} />
            </button>
          )}
          {/* ถัดไป */}
          {index! < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndex(index! + 1);
              }}
              className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="ถัดไป"
            >
              <ChevronRight size={26} />
            </button>
          )}

          <motion.img
            key={photos[index!].id}
            src={photos[index!].photo_url}
            alt={photos[index!].caption ?? ""}
            className="max-h-[88vh] max-w-[94vw] object-contain"
            initial={{ scale: 0.96, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* ตัวนับ + caption */}
          <div className="absolute bottom-4 left-0 right-0 px-4 text-center text-sm text-white/80">
            {photos[index!].caption && <div className="mb-1">{photos[index!].caption}</div>}
            <div className="text-xs text-white/60">
              {index! + 1} / {photos.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
