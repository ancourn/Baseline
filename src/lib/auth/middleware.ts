import { auth } from '@/lib/auth/config'

export default auth((req) => {
  // Protected routes
  const protectedRoutes = ['/dashboard', '/agents', '/tasks', '/templates']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !req.auth) {
    const loginUrl = new URL('/auth/signin', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return Response.redirect(loginUrl)
  }

  return Response.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)',
  ],
}