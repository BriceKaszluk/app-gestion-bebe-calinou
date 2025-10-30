"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react"; // icône ❤️
import Image from "next/image";
import ImagePreview from "@/components/ImagePreview";

type Entry = {
  _id: string;
  message: string;
  createdAt: string;
  favorite?: boolean;
  imagePath?: string;      // chemin du fichier Supabase (stocké en base)
  signedUrl?: string;      // URL signée temporaire (générée côté serveur)
};

type Filter = "all" | "today" | "week";

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [file, setFile] = useState<File | null>(null);

  // Charger les entrées existantes
useEffect(() => {
  async function loadEntries() {
    const cacheKey = "journalCache";
    const cacheData = localStorage.getItem(cacheKey);

    if (cacheData) {
      const parsed = JSON.parse(cacheData);
      if (Date.now() < parsed.expiresAt) {
        setEntries(parsed.data);
        return;
      }
    }

    const res = await fetch("/api/journal");
    const data = await res.json();

    if (!res.ok) return;

    // On complète les entrées avec les URLs signées
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
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: withUrls,
        expiresAt: Date.now() + 55 * 60 * 1000, // cache 55 min
      })
    );
  }

  loadEntries();
}, []);

  // Envoi du message
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!message.trim()) return;

  setLoading(true);

  // 1️⃣ Création du message texte
  const res = await fetch("/api/journal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    alert("Erreur lors de l’enregistrement.");
    setLoading(false);
    return;
  }

  const newEntry = await res.json();

  // 2️⃣ Upload de l’image si elle existe
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

      // 3️⃣ Création d’une URL signée pour affichage immédiat
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

  // 4️⃣ Ajout local + reset
  setEntries([newEntry, ...entries]);
  setMessage("");
  setFile(null);
  setLoading(false);
  localStorage.removeItem("journalCache"); // force le refresh cache
}


  // Filtrage par date
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    const now = new Date();

    if (filter === "today") {
      return entryDate.toDateString() === now.toDateString();
    }

    if (filter === "week") {
      const diff = now.getTime() - entryDate.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 7;
    }

    return true; // all
  });

  // Gestion des favoris
const toggleFavorite = async (id: string) => {
  // Optimiste : on met à jour localement pour une sensation instantanée
  setEntries((prev) =>
    prev.map((e) =>
      e._id === id ? { ...e, favorite: !e.favorite } : e
    )
  );

  // Puis on envoie au serveur
  await fetch(`/api/journal/${id}/favorite`, {
    method: "PATCH",
  });
};


  return (
    <Card className="max-w-lg mx-auto p-4 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Journal de bébé 🍼
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écris un souvenir ou un moment mignon..."
            rows={3}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <ImagePreview file={file} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Envoi..." : "Ajouter au journal"}
          </Button>
        </form>

        {/* Filtres */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Filtrer :</p>
          <div className="space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Tous
            </Button>
            <Button
              variant={filter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("today")}
            >
              Aujourd’hui
            </Button>
            <Button
              variant={filter === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("week")}
            >
              7 jours
            </Button>
          </div>
        </div>

        {/* Liste des entrées */}
        <ScrollArea className="h-[300px] border rounded-md p-2 bg-muted/20">
          {filteredEntries.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Aucun message trouvé pour ce filtre.
            </p>
          )}

          <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <Card
              key={entry._id}
              className={cn(
                "bg-white shadow-sm border relative",
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

                {/* 🖼️ Image si elle existe */}
                {entry.signedUrl && (
                  <div className="relative w-full h-64 mb-2 overflow-hidden rounded-md">
                    <Image
                      src={entry.signedUrl}
                      alt="Souvenir de bébé"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={false}
                    />
                  </div>
                )}
                <p className="pr-6">{entry.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(entry.createdAt).toLocaleString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
