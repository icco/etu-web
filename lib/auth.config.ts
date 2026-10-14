import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Edge-compatible auth config (no Prisma imports)
// Used by middleware for session validation
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnApp = nextUrl.pathname.startsWith("/notes") || 
                      nextUrl.pathname.startsWith("/settings")

      if (isOnApp) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [
    // Credentials provider stub for Edge - actual validation happens in auth.ts
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: () => null, // Never authorizes - full auth.ts handles this
    }),
  ],
} satisfies NextAuthConfig
