import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const steamId = request.nextUrl.searchParams.get("steamid");

  if (!steamId) {
    return NextResponse.json({ error: "Missing steamid parameter" }, { status: 400 });
  }

  try {
    // Try to extract or resolve Steam64 ID
    const steamIdClean = await resolveSteamId(steamId.trim());
    if (!steamIdClean) {
      return NextResponse.json(
        { error: "Invalid Steam ID. Use your 17-digit Steam64 ID or profile URL." },
        { status: 400 }
      );
    }

    // CS:GO app ID is 730, context ID is 2
    const url = `https://steamcommunity.com/inventory/${steamIdClean}/730/2?l=english&count=5000`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ error: "Inventory is private or profile doesn't exist" }, { status: 403 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limited by Steam, try again in a few minutes" }, { status: 429 });
      }
      if (response.status === 500) {
        return NextResponse.json({ error: "Steam servers are having issues, try again later" }, { status: 502 });
      }
      return NextResponse.json(
        { error: `Steam returned error ${response.status}` },
        { status: response.status }
      );
    }

    // Try to parse JSON
    let data;
    try {
      const text = await response.text();
      if (!text || text === "null") {
        return NextResponse.json({ error: "Inventory is empty or private" }, { status: 404 });
      }
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid response from Steam" }, { status: 502 });
    }

    // Check for Steam error responses
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    // Parse and return only case items
    const cases = extractCases(data);

    return NextResponse.json({ cases, steamId: steamIdClean });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

async function resolveSteamId(input: string): Promise<string | null> {
  // Clean up input
  const cleaned = input.trim();

  // Already a Steam64 ID (17 digits)
  if (/^\d{17}$/.test(cleaned)) {
    return cleaned;
  }

  // Profile URL with Steam64 ID: https://steamcommunity.com/profiles/76561198012345678
  const profileMatch = cleaned.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // Vanity URL: https://steamcommunity.com/id/username
  const vanityMatch = cleaned.match(/steamcommunity\.com\/id\/([^\/\?\s]+)/);
  if (vanityMatch) {
    const vanityName = vanityMatch[1];
    return await resolveVanityUrl(vanityName);
  }

  // Maybe just a vanity name without full URL
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned) && cleaned.length >= 2 && cleaned.length <= 32) {
    // Could be a vanity name, try to resolve it
    const resolved = await resolveVanityUrl(cleaned);
    if (resolved) return resolved;
  }

  return null;
}

async function resolveVanityUrl(vanityName: string): Promise<string | null> {
  try {
    // Fetch the profile page and extract Steam64 ID from it
    const profileUrl = `https://steamcommunity.com/id/${vanityName}`;
    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Look for Steam64 ID in the page - it appears in various places
    // Pattern 1: "steamid":"76561198012345678"
    const steamIdMatch = html.match(/"steamid":"(\d{17})"/);
    if (steamIdMatch) {
      return steamIdMatch[1];
    }

    // Pattern 2: g_rgProfileData with steamid
    const profileDataMatch = html.match(/g_rgProfileData\s*=\s*\{[^}]*"steamid":"(\d{17})"/);
    if (profileDataMatch) {
      return profileDataMatch[1];
    }

    // Pattern 3: data-steamid="76561198012345678"
    const dataSteamIdMatch = html.match(/data-steamid="(\d{17})"/);
    if (dataSteamIdMatch) {
      return dataSteamIdMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

interface SteamItemDescription {
  classid: string;
  instanceid: string;
  market_hash_name: string;
  type: string;
  tradable: number;
  marketable: number;
  tags?: Array<{
    category: string;
    internal_name: string;
    localized_tag_name: string;
  }>;
}

interface SteamInventoryResponse {
  assets?: Array<{
    classid: string;
    instanceid: string;
    amount: string;
  }>;
  descriptions?: SteamItemDescription[];
  error?: string;
  success?: number;
}

interface CaseItem {
  name: string;
  quantity: number;
  tradable: boolean;
  marketable: boolean;
}

function extractCases(data: SteamInventoryResponse): CaseItem[] {
  if (!data.assets || !data.descriptions) {
    return [];
  }

  // Create a map of classid+instanceid to description
  const descriptionMap = new Map<string, SteamItemDescription>();
  for (const desc of data.descriptions) {
    const key = `${desc.classid}_${desc.instanceid}`;
    descriptionMap.set(key, desc);
  }

  // Count items by name
  const itemCounts = new Map<string, CaseItem>();

  for (const asset of data.assets) {
    const key = `${asset.classid}_${asset.instanceid}`;
    const desc = descriptionMap.get(key);

    if (!desc) continue;

    // Check if it's a case or capsule (marketable container)
    const isCase = desc.tags?.some(
      (tag) =>
        tag.category === "Type" &&
        (tag.internal_name === "CSGO_Type_WeaponCase" ||
          tag.internal_name === "CSGO_Tool_Sticker_Capsule" ||
          tag.localized_tag_name === "Container")
    );

    if (!isCase) continue;

    const name = desc.market_hash_name;
    const existing = itemCounts.get(name);
    const amount = parseInt(asset.amount, 10) || 1;

    if (existing) {
      existing.quantity += amount;
    } else {
      itemCounts.set(name, {
        name,
        quantity: amount,
        tradable: desc.tradable === 1,
        marketable: desc.marketable === 1,
      });
    }
  }

  // Sort by name and return
  return Array.from(itemCounts.values()).sort((a, b) => a.name.localeCompare(b.name));
}
