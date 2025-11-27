// src/app/api/events/stats/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { verifyBabyAccess } from "@/lib/babies";
import { getBabyTimerStats } from "@/lib/timers/stats";
import { timerStatsResponseSchema } from "@/lib/timers/schema";

export const runtime = "nodejs";

const querySchema = z.object({
  babyId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export async function GET(req: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 },
    );
  }

  const { babyId, days } = parsed.data;

  if (!(await verifyBabyAccess(email, babyId))) {
    return NextResponse.json(
      { error: "Accès refusé à ce bébé" },
      { status: 403 },
    );
  }

  try {
    const stats = await getBabyTimerStats(babyId, days);
    const safe = timerStatsResponseSchema.parse(stats);
    return NextResponse.json(safe, { status: 200 });
  } catch (error) {
    console.error("[GET /api/events/stats]", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des statistiques" },
      { status: 500 },
    );
  }
}
