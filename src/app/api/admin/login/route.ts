import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me";

  if (password !== adminPassword) {
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
