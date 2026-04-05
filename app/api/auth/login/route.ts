import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

function signToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password: string };

  const dashPassword = process.env.DASHBOARD_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!dashPassword || !sessionSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Timing-safe comparison
  const inputBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(dashPassword);

  if (inputBuf.length !== expectedBuf.length || !timingSafeEqual(inputBuf, expectedBuf)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Create session token
  const token = crypto.randomUUID();
  const signature = signToken(token, sessionSecret);
  const cookieValue = `${token}.${signature}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ytc-session", cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800, // 7 days
  });

  return res;
}
