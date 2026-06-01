import { createHmac, timingSafeEqual } from "crypto";

export const STEAM_SESSION_COOKIE = "steam_session";

export interface SteamSession {
  steamId: string;
  profileUrl: string;
  signedInAt: number;
}

export interface SteamProfile extends SteamSession {
  personaName: string | null;
  avatarUrl: string | null;
  visibilityState: string | null;
}

function getSessionSecret() {
  return (
    process.env.STEAM_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "steam-multisell-url-builder-development-secret"
  );
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSteamSessionToken(session: SteamSession) {
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function readSteamSessionToken(token: string | undefined): SteamSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(decode(payload)) as SteamSession;
    if (!/^\d{17}$/.test(session.steamId)) return null;
    return session;
  } catch {
    return null;
  }
}

export function buildSteamSession(steamId: string): SteamSession {
  return {
    steamId,
    profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
    signedInAt: Date.now(),
  };
}

export async function fetchSteamProfile(session: SteamSession): Promise<SteamProfile> {
  try {
    const response = await fetch(`${session.profileUrl}/?xml=1`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return { ...session, personaName: null, avatarUrl: null, visibilityState: null };
    }

    const xml = await response.text();

    return {
      ...session,
      personaName: readXmlValue(xml, "steamID"),
      avatarUrl: readXmlValue(xml, "avatarFull") || readXmlValue(xml, "avatarMedium"),
      visibilityState: readXmlValue(xml, "visibilityState"),
    };
  } catch {
    return { ...session, personaName: null, avatarUrl: null, visibilityState: null };
  }
}

function readXmlValue(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>|<${tagName}>([\\s\\S]*?)</${tagName}>`));
  const value = match?.[1] || match?.[2];
  if (!value) return null;

  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
