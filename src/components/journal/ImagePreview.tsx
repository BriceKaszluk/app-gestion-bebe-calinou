"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function ImagePreview({ file }: { file: File | null }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Nettoyage mémoire
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <AnimatePresence mode="wait">
      {previewUrl && (
        <motion.div
          key={previewUrl}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full h-48 mt-2 overflow-hidden rounded-md"
        >
          <Image
            src={previewUrl}
            alt="Prévisualisation"
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
