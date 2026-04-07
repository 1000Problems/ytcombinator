import { NextRequest, NextResponse } from "next/server";

const encoder = new TextEncoder();

async function hmacSha256(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySession(cookie: string, secret: string): Promise<boolean> {
  const dotIdx = cookie.indexOf(".");
  if (dotIdx === -1) return false;

  const token = cookie.slice(0, dotIdx);
  const signature = cookie.slice(dotIdx + 1);
  const expected = await hmacSha256(secret, token);

  return signature === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/analyze")) {
    return NextResponse.next();
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const cookie = req.cookies.get("ytc-session")?.value;
  if (!cookie || !(await verifySession(cookie, sessionSecret))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/analyze/:path*"],
};
