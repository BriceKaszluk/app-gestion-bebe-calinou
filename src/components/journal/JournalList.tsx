"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Pin } from "lucide-react";
import { Entry } from "@/hooks/useJournalEntries";

type Props = {
  entries: Entry[];
  loading: boolean;
  toggleFavorite: (id: string) => void;
};

export default function JournalList({ entries, loading, toggleFavorite }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="w-full h-64 rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0)
    return <p className="text-sm text-gray-500 text-center">Aucune note pour l’instant.</p>;

  return (
    <ScrollArea className="h-[60vh] sm:h-[400px] border rounded-md p-2 bg-muted/20">
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry._id}
            className={cn(
              "bg-white shadow-sm border relative transition",
              entry.favorite && "border-yellow-400"
            )}
          >
            <CardContent className="p-3">
              <button
                type="button"
                onClick={() => toggleFavorite(entry._id)}
                title={entry.favorite ? "Retirer des notes importantes" : "Marquer comme important"}
                className="absolute top-2 right-2 text-gray-400 hover:text-yellow-500 transition"
              >
                <Pin
                  size={18}
                  fill={entry.favorite ? "rgb(250,204,21)" : "none"}
                  className={entry.favorite ? "rotate-12" : ""}
                />
              </button>

              {entry.signedUrl && (
                <div className="relative w-full h-64 sm:h-72 mb-2 overflow-hidden rounded-md">
                  <Image
                    src={entry.signedUrl}
                    alt="Image jointe"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}

              <p className="text-sm sm:text-base pr-6 break-words text-gray-800">
                {entry.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(entry.createdAt).toLocaleString("fr-FR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
