import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const { pathname } = req.nextUrl

  // Protected routes
  const protectedPaths = ["/notes", "/settings"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ["/login", "/register"]
  const isAuthPage = authPaths.includes(pathname)

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/notes", req.nextUrl.origin))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
