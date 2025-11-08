"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ImagePreview from "@/components/ImagePreview";

type Props = {
  onSubmit: (message: string, file: File | null) => Promise<void>;
  loading: boolean;
};

export default function JournalForm({ onSubmit, loading }: Props) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSubmit(message, file);
    setMessage("");
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ajoutez une info rapide ou un message pour l’autre parent (ex : bib 150ml à 7h20, petite fièvre, nouvelle photo...)"
        rows={3}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm w-full"
      />
      <ImagePreview file={file} />
      <Button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="animate-spin h-4 w-4" />}
        {loading ? "Ajout en cours..." : "Ajouter une note"}
      </Button>
    </form>
  );
}
