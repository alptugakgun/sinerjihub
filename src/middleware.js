import { NextResponse } from 'next/server';

export function middleware(request) {
  // Tarayıcıdaki çerezlerden (cookie) token'ı okumaya çalış
  const token = request.cookies.get('token')?.value;
  const url = request.nextUrl.clone();

  // Eğer JWT (Token) yoksa ve kişi /admin sayfasına gitmeye çalışıyorsa
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    // Kapıdan çevir ve login'e postala
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Her şey yolundaysa geçişe izin ver
  return NextResponse.next();
}

// Bu kalkan sadece hangi yollarda (routes) çalışsın?
export const config = {
  matcher: ['/admin/:path*'], 
};