import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const token = request.cookies.get('sb-xxbgmcalobabafdrxjcn-auth-token')

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
