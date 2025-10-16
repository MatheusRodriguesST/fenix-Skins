// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect("/");
  res.cookies.set({
    name: "fenix_token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
