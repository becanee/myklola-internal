import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Hanya sign-in yang public — semua route lain protected (termasuk /)
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/v1(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, dan asset files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
