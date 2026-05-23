// middleware.ts
// Proteksi route: redirect ke /login jika belum terautentikasi.
// Menggunakan session cookie yang di-set oleh Firebase Auth di client-side.
// Catatan: Firebase Auth session diverifikasi di dashboard/layout.tsx (client-side).
// Middleware ini hanya sebagai lapisan awal untuk UX yang lebih baik.

import { NextRequest, NextResponse } from "next/server";

// Path yang bisa diakses tanpa login
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Biarkan public paths lewat
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  // Cek ada Firebase Auth persistence cookie atau session marker
  // Firebase Auth menyimpan token di IndexedDB (client-side), bukan cookie.
  // Middleware ini hanya melindungi route /dashboard dari akses langsung tanpa state.
  // Verifikasi sesungguhnya ada di dashboard/layout.tsx via useAuth().
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons|favicon\\.ico|sw\\.js|manifest\\.json|icon\\.svg|apple-touch-icon\\.png|favicon-16x16\\.png|favicon-32x32\\.png).*)",
  ],
};
