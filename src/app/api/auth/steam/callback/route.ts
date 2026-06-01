import { NextRequest, NextResponse } from "next/server";
import {
  STEAM_SESSION_COOKIE,
  buildSteamSession,
  createSteamSessionToken,
} from "../../../../lib/steamAuth";

export async function GET(request: NextRequest) {
  const steamId = extractSteamId(request.nextUrl.searchParams.get("openid.claimed_id"));

  if (!steamId) {
    return redirectWithError(request, "Steam did not return a valid account ID");
  }

  const isValid = await validateSteamOpenId(request.nextUrl.searchParams);
  if (!isValid) {
    return redirectWithError(request, "Steam sign-in could not be verified");
  }

  const session = buildSteamSession(steamId);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(STEAM_SESSION_COOKIE, createSteamSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

async function validateSteamOpenId(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams);
  params.set("openid.mode", "check_authentication");

  const response = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) return false;

  const result = await response.text();
  return result.includes("is_valid:true");
}

function extractSteamId(claimedId: string | null) {
  return claimedId?.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})/)?.[1] || null;
}

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("authError", message);
  return NextResponse.redirect(url);
}
