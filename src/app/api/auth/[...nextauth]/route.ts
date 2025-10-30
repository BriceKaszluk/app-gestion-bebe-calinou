export const runtime = "nodejs";

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

// ✅ Création de NextAuth avec déstructuration explicite
const { handlers } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
});

// ✅ Export propre des méthodes HTTP attendues par Next.js
export const { GET, POST } = handlers;
