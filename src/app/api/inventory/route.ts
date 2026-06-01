import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const steamId = request.nextUrl.searchParams.get("steamid");

  if (!steamId) {
    return NextResponse.json({ error: "Missing steamid parameter" }, { status: 400 });
  }

  // Validate Steam ID format (should be 17-digit number for Steam64 ID)
  const steamIdClean = extractSteamId(steamId);
  if (!steamIdClean) {
    return NextResponse.json({ error: "Invalid Steam ID format" }, { status: 400 });
  }

  try {
    // CS:GO app ID is 730, context ID is 2
    const url = `https://steamcommunity.com/inventory/${steamIdClean}/730/2?l=english&count=5000`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ error: "Inventory is private" }, { status: 403 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limited, try again later" }, { status: 429 });
      }
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: response.status });
    }

    const data = await response.json();

    // Parse and return only case items
    const cases = extractCases(data);

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

function extractSteamId(input: string): string | null {
  // Already a Steam64 ID (17 digits)
  if (/^\d{17}$/.test(input)) {
    return input;
  }

  // Profile URL: https://steamcommunity.com/profiles/76561198012345678
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // Custom URL: https://steamcommunity.com/id/customname - can't resolve without API key
  // For now, return null and let user enter Steam64 ID
  if (input.includes("steamcommunity.com/id/")) {
    return null; // Custom URLs need Steam API to resolve
  }

  return null;
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
    const isCase = desc.tags?.some(tag =>
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
