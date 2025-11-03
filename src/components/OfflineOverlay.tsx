// src/components/OfflineOverlay.tsx
"use client";

import { useState } from "react";
import { WifiOff, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type Props = {
  isOnline: boolean;
  onRetry?: () => void;
};

export default function OfflineOverlay({ isOnline, onRetry }: Props) {
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 800)); // 💡 petit délai visuel
    setChecking(false);
    if (navigator.onLine && onRetry) onRetry();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6"
        >
          <WifiOff className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucune connexion</h2>
          <p className="text-center text-muted-foreground mb-6 max-w-sm">
            Vous devez être connecté à Internet pour utiliser Calinou.
          </p>
          <Button onClick={handleRetry} disabled={checking}>
            {checking ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Vérification...
              </>
            ) : (
              "Réessayer"
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
