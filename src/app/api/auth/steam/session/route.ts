import { NextRequest, NextResponse } from "next/server";
import {
  STEAM_SESSION_COOKIE,
  fetchSteamProfile,
  readSteamSessionToken,
} from "../../../../lib/steamAuth";

export async function GET(request: NextRequest) {
  const session = readSteamSessionToken(request.cookies.get(STEAM_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: await fetchSteamProfile(session) });
}
