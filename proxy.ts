import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signUp']
const AUTH_ROUTES   = ['/login', '/signUp']
const LANDING_ROUTE = '/'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const isPublic  = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuth    = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isLanding = pathname === '/'

  // Connecté + landing page → dashboard directement
  if (token && isLanding) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Connecté + tente login/signUp → dashboard
  if (token && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // // Pas connecté + page privée → login
  // if (!token && !isPublic) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|assets|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)',
  ],
}