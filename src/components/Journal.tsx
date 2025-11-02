"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import ImagePreview from "@/components/ImagePreview";

type Entry = {
  _id: string;
  message: string;
  createdAt: string;
  favorite?: boolean;
  imagePath?: string;
  signedUrl?: string;
};

type Filter = "all" | "today" | "week";

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [file, setFile] = useState<File | null>(null);

  // 🧭 Charger les entrées existantes
  useEffect(() => {
    async function loadEntries() {
      setInitialLoading(true);

      const cacheKey = "journalCache";
      const cacheData = localStorage.getItem(cacheKey);

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        if (Date.now() < parsed.expiresAt) {
          setEntries(parsed.data);
          setInitialLoading(false);
          return;
        }
      }

      const res = await fetch("/api/journal");
      const data = await res.json();

      if (!res.ok) {
        setInitialLoading(false);
        return;
      }

      const withUrls = await Promise.all(
        data.map(async (entry: Entry) => {
          if (!entry.imagePath) return entry;

          const urlRes = await fetch("/api/journal/CreateImageSignedUrl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: entry.imagePath }),
          });

          const { url } = await urlRes.json();
          return { ...entry, signedUrl: url };
        })
      );

      setEntries(withUrls);
      setInitialLoading(false);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: withUrls,
          expiresAt: Date.now() + 55 * 60 * 1000,
        })
      );
    }

    loadEntries();
  }, []);

  // ✏️ Envoi du message
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);

    // Squelette temporaire pour UX fluide
    const tempId = `temp-${Date.now()}`;
    const skeletonEntry: Entry = {
      _id: tempId,
      message,
      createdAt: new Date().toISOString(),
      signedUrl: file ? "skeleton" : undefined,
    };
    setEntries((prev) => [skeletonEntry, ...prev]);

    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      alert("Erreur lors de l’enregistrement.");
      setEntries((prev) => prev.filter((e) => e._id !== tempId));
      setLoading(false);
      return;
    }

    const newEntry = await res.json();

    // Upload image
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entryId", newEntry._id);

      const uploadRes = await fetch("/api/journal/uploadDiaryImage", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const urlRes = await fetch("/api/journal/CreateImageSignedUrl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: uploadData.path }),
        });
        const { url } = await urlRes.json();

        newEntry.imagePath = uploadData.path;
        newEntry.signedUrl = url;
      }
    }

    setEntries((prev) =>
      [newEntry, ...prev.filter((e) => e._id !== tempId)]
    );
    setMessage("");
    setFile(null);
    setLoading(false);
    localStorage.removeItem("journalCache");
  }

  // 🔍 Filtrage
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    const now = new Date();

    if (filter === "today") return entryDate.toDateString() === now.toDateString();
    if (filter === "week") {
      const diff = now.getTime() - entryDate.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 7;
    }
    return true;
  });

  // ❤️ Favoris
  const toggleFavorite = async (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, favorite: !e.favorite } : e))
    );
    await fetch(`/api/journal/${id}/favorite`, { method: "PATCH" });
  };

  return (
    <Card className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl p-4 sm:p-6 rounded-2xl shadow-md bg-white">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold text-center">
          Journal de bébé 🍼
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🧾 Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écris un souvenir ou un moment mignon..."
            rows={3}
            className="resize-none"
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
            {loading ? "Envoi en cours..." : "Ajouter au journal"}
          </Button>
        </form>

        {/* 🔘 Filtres */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4">
          <p className="text-sm text-gray-600">Filtrer :</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "today", "week"] as Filter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "Tous"
                  : f === "today"
                  ? "Aujourd’hui"
                  : "7 jours"}
              </Button>
            ))}
          </div>
        </div>

        {/* 📜 Liste des entrées */}
        <ScrollArea className="h-[60vh] sm:h-[400px] border rounded-md p-2 bg-muted/20">
          {initialLoading ? (
            // 🔄 Skeleton au chargement initial
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white shadow-sm border">
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="w-full h-64 rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">
              Aucun message trouvé pour ce filtre.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) =>
                entry.signedUrl === "skeleton" ? (
                  // 🦴 Skeleton temporaire pendant upload
                  <Card key={entry._id} className="bg-white shadow-sm border">
                    <CardContent className="p-3 space-y-2">
                      <Skeleton className="w-full h-64 rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    key={entry._id}
                    className={cn(
                      "bg-white shadow-sm border relative transition",
                      entry.favorite && "border-pink-400"
                    )}
                  >
                    <CardContent className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(entry._id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-pink-500 transition"
                      >
                        <Heart
                          size={18}
                          fill={entry.favorite ? "rgb(236,72,153)" : "none"}
                        />
                      </button>

                      {entry.signedUrl && (
                        <div className="relative w-full h-64 sm:h-72 mb-2 overflow-hidden rounded-md">
                          <Image
                            src={entry.signedUrl}
                            alt="Souvenir de bébé"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      )}
                      <p className="text-sm sm:text-base pr-6 break-words">
                        {entry.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
