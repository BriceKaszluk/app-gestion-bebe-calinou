import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Récupère le token JWT sans charger MongoDB
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");

  // Si l'utilisateur n'est pas connecté et tente d'accéder à /auth/*
  if (!isLoggedIn && isAuthRoute) {
    const loginUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Sinon on le laisse passer
  return NextResponse.next();
}

// Appliquer uniquement sur les routes /auth/*
export const config = {
  matcher: ["/auth/:path*"],
};
