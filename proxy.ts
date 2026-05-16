import { NextRequest, NextResponse } from 'next/server'

// Routes accessibles sans token
const PUBLIC_ROUTES = ['/', '/login', '/signUp']

// Routes réservées aux non-connectés
const AUTH_ROUTES = ['/login', '/signUp']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuth   = AUTH_ROUTES.some(r => pathname.startsWith(r))

  // Pas de token + page privée → login
//   if (!token && !isPublic) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }

  // Connecté + tente d'aller sur login ou signUp → dashboard
  if (token && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|assets|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)',
  ],
}