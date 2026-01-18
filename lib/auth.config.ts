import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnApp = nextUrl.pathname.startsWith("/notes") || 
                      nextUrl.pathname.startsWith("/settings")
      const isOnAuth = nextUrl.pathname === "/login" || 
                       nextUrl.pathname === "/register"

      if (isOnApp) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/notes", nextUrl))
      }

      return true
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
