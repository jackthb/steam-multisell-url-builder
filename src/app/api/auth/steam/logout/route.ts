import { NextRequest, NextResponse } from "next/server";
import { STEAM_SESSION_COOKIE } from "../../../../lib/steamAuth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(STEAM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 0,
    path: "/",
  });

  return response;
}
