import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getAuthSecret,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Gembok login untuk seluruh aplikasi.
 *
 * Mengizinkan akses jika token sesi valid di cookie `keuangan_session`.
 * Pengguna yang belum login diarahkan ke `/login`.
 */

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const username = await verifySessionToken(token, getAuthSecret());
  return username !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API bot punya auth sendiri (Bearer BOT_API_KEY), tidak ikut sesi browser.
  if (pathname.startsWith("/api/bot/")) {
    return NextResponse.next();
  }

  // Aset PWA publik (manifest, service worker, ikon, halaman offline) boleh dibuka tanpa sesi.
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next();
  }

  const loggedIn = await isAuthenticated(request);

  // Halaman login selalu boleh dibuka; yang sudah login dilempar ke beranda.
  if (pathname === "/login") {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Jika belum login, arahkan ke /login
  if (!loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Abaikan aset statis, favicon, dan API publik supaya tidak dicek sesi.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
