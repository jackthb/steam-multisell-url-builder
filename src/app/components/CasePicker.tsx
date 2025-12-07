"use client";

import { useState } from "react";
import { ALL_CONTAINERS } from "../data/cases";

interface InventoryItem {
  name: string;
  quantity: number;
  tradable: boolean;
  marketable: boolean;
}

interface SelectedItem {
  name: string;
  quantity: number; // how many selected (up to max owned)
  maxQuantity: number; // how many owned
}

const CSGO_ID = 730;

function buildSteamUrl(items: SelectedItem[]): string {
  const baseUrl = `https://steamcommunity.com/market/multisell?appid=${CSGO_ID}&contextid=2`;

  // Add each item the number of times selected
  const itemParams: string[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const encoded = encodeURIComponent(item.name);
      itemParams.push(`items%5B%5D=${encoded}`);
    }
  }

  if (itemParams.length === 0) return baseUrl;
  return `${baseUrl}&${itemParams.join("&")}`;
}

export function CasePicker() {
  // Mode: "inventory" (fetch from Steam) or "manual" (use full list)
  const [mode, setMode] = useState<"inventory" | "manual">("inventory");

  // Steam ID input
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inventory items from Steam
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Selected items
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  // Search filter
  const [search, setSearch] = useState("");

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Items to display based on mode
  const availableItems: InventoryItem[] =
    mode === "inventory"
      ? inventory
      : ALL_CONTAINERS.map((name) => ({
          name,
          quantity: 1,
          tradable: true,
          marketable: true,
        }));

  // Filter by search
  const filteredItems = availableItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch inventory from Steam
  async function fetchInventory() {
    if (!steamId.trim()) {
      setError("Please enter a Steam ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory?steamid=${encodeURIComponent(steamId)}`);
      const data = await res.json();

      if (!res.ok) {
        let errMsg = data.error || "Failed to fetch inventory";
        if (data.debug) {
          errMsg += ` (Debug: ${JSON.stringify(data.debug)})`;
        }
        setError(errMsg);
        return;
      }

      setInventory(data.cases || []);
      setSelected([]); // Clear selection on new fetch

      if (data.cases?.length === 0) {
        setError(data.message || "No cases found. You can use Manual Selection mode instead.");
      }
    } catch (e) {
      setError(`Failed to fetch inventory: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  // Toggle item selection
  function toggleItem(item: InventoryItem) {
    const existing = selected.find((s) => s.name === item.name);

    if (existing) {
      // Remove from selection
      setSelected(selected.filter((s) => s.name !== item.name));
    } else {
      // Add to selection
      setSelected([
        ...selected,
        {
          name: item.name,
          quantity: item.quantity,
          maxQuantity: item.quantity,
        },
      ]);
    }
  }

  // Update quantity for selected item
  function updateQuantity(name: string, quantity: number) {
    setSelected(
      selected.map((s) =>
        s.name === name ? { ...s, quantity: Math.max(1, Math.min(quantity, s.maxQuantity)) } : s
      )
    );
  }

  // Select all visible items
  function selectAll() {
    const newSelected: SelectedItem[] = filteredItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      maxQuantity: item.quantity,
    }));
    setSelected(newSelected);
  }

  // Clear selection
  function clearSelection() {
    setSelected([]);
  }

  // Check if item is selected
  function isSelected(name: string): boolean {
    return selected.some((s) => s.name === name);
  }

  // Build URL
  const url = buildSteamUrl(selected);
  const totalItems = selected.reduce((sum, s) => sum + s.quantity, 0);

  // Copy URL to clipboard
  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: 800, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 16, fontSize: 24 }}>Steam Multi-Sell Builder</h1>

      {/* Mode Toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            name="mode"
            checked={mode === "inventory"}
            onChange={() => setMode("inventory")}
            style={{ marginRight: 4 }}
          />
          Load from Steam Inventory
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === "manual"}
            onChange={() => setMode("manual")}
            style={{ marginRight: 4 }}
          />
          Manual Selection
        </label>
      </div>

      {/* Steam ID Input (inventory mode only) */}
      {mode === "inventory" && (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc" }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Steam ID (17-digit ID or profile URL):
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="76561198012345678"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  border: "1px solid #ccc",
                  fontSize: 14,
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchInventory()}
              />
              <button
                onClick={fetchInventory}
                disabled={loading}
                style={{
                  padding: "6px 16px",
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Loading..." : "Load Inventory"}
              </button>
            </div>
          </div>
          {error && <div style={{ color: "red", fontSize: 14 }}>{error}</div>}
          <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Your inventory must be public. Find your Steam64 ID at{" "}
            <a href="https://steamid.io" target="_blank" rel="noopener noreferrer">
              steamid.io
            </a>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cases..."
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #ccc",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Available Items */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>
            {mode === "inventory" ? "Your Cases" : "All Cases"} ({filteredItems.length})
          </strong>
          <span style={{ fontSize: 14 }}>
            <button onClick={selectAll} style={{ marginRight: 8, cursor: "pointer" }}>
              Select all
            </button>
            <button onClick={clearSelection} style={{ cursor: "pointer" }}>
              Clear
            </button>
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            {mode === "inventory"
              ? "No cases loaded. Enter your Steam ID above."
              : "No cases match your search."}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filteredItems.map((item) => {
              const sel = isSelected(item.name);
              return (
                <button
                  key={item.name}
                  onClick={() => toggleItem(item)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 13,
                    border: sel ? "2px solid #333" : "1px solid #aaa",
                    background: sel ? "#e0e0e0" : "#fff",
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                >
                  {item.name}
                  {item.quantity > 1 && ` (x${item.quantity})`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Items */}
      <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc" }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Selected ({totalItems} items)</strong>
        </div>

        {selected.length === 0 ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>No items selected</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selected.map((item) => (
              <span
                key={item.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  fontSize: 13,
                  border: "1px solid #333",
                  background: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                {item.name}
                {item.maxQuantity > 1 && (
                  <input
                    type="number"
                    min={1}
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.name, parseInt(e.target.value) || 1)}
                    style={{
                      width: 40,
                      padding: 2,
                      fontSize: 12,
                      textAlign: "center",
                      border: "1px solid #aaa",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <button
                  onClick={() => setSelected(selected.filter((s) => s.name !== item.name))}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: 14,
                  }}
                  title="Remove"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={selected.length > 0 ? url : undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "8px 20px",
            background: selected.length > 0 ? "#1a1a1a" : "#ccc",
            color: "#fff",
            textDecoration: "none",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Open in Steam
        </a>
        <button
          onClick={copyUrl}
          disabled={selected.length === 0}
          style={{
            padding: "8px 20px",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}
