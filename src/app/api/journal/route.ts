import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { JournalEntrySchema } from "@/lib/validation";
import { verifyBabyAccess } from "@/lib/babies";
import { insertJournalEntry, findJournalEntries } from "@/lib/journal";

export const runtime = "nodejs";

// 🧾 GET — Récupérer les entrées
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const babyId = url.searchParams.get("babyId");
  const filter = url.searchParams.get("filter") || "all";

  if (!babyId)
    return NextResponse.json({ error: "babyId requis" }, { status: 400 });

  const access = await verifyBabyAccess(session.user.email, babyId);
  if (!access)
    return NextResponse.json({ error: "Accès refusé à ce profil bébé" }, { status: 403 });

  const entries = await findJournalEntries(session.user.email, babyId, filter);
  return NextResponse.json(entries);
}

// 📝 POST — Ajouter une note
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const json = await req.json();
  const parsed = JournalEntrySchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { babyId, message } = parsed.data;
  const access = await verifyBabyAccess(session.user.email, babyId);
  if (!access)
    return NextResponse.json({ error: "Accès refusé à ce profil bébé" }, { status: 403 });

  const entry = await insertJournalEntry({
    userEmail: session.user.email,
    babyId,
    message,
  });

  return NextResponse.json(entry, { status: 201 });
}
