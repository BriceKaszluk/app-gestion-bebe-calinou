// src/middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user

  if (!isLoggedIn && req.nextUrl.pathname.startsWith("/auth")) {
    const loginUrl = new URL("/", req.nextUrl.origin)
    return Response.redirect(loginUrl)
  }
})
