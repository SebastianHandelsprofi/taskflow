import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Diese Seiten sind ohne Login zugänglich
  const publicPaths = ['/login', '/invite']
  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  if (isPublic) return NextResponse.next()

  // Alle anderen Seiten brauchen einen Login-Cookie
  const token = request.cookies.get('sb-xxbgmcalobabafdrxjcn-auth-token')
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
