// src/lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google" // ou ton provider (ex: credentials, Google...)

export const { auth, handlers } = NextAuth({
  providers: [Google],
  callbacks: {
    authorized({ auth }) {
      // Retourne true si l'utilisateur est connecté
      return !!auth?.user
    },
  },
})
