// Complete list of all CS:GO/CS2 weapon cases and capsules
// Last updated: 2025

export const ALL_CASES = [
  // Newest cases (2024-2025)
  "Fever Case",
  "Gallery Case",
  "Kilowatt Case",
  "Revolution Case",

  // 2022-2023
  "Recoil Case",
  "Dreams & Nightmares Case",

  // Operations
  "Operation Riptide Case",
  "Operation Broken Fang Case",
  "Shattered Web Case",
  "Operation Hydra Case",
  "Operation Wildfire Case",
  "Operation Vanguard Weapon Case",
  "Operation Breakout Weapon Case",
  "Operation Phoenix Weapon Case",
  "Operation Bravo Case",

  // Spectrum series
  "Spectrum 2 Case",
  "Spectrum Case",

  // Prisma series
  "Prisma 2 Case",
  "Prisma Case",

  // Gamma series
  "Gamma 2 Case",
  "Gamma Case",

  // Chroma series
  "Chroma 3 Case",
  "Chroma 2 Case",
  "Chroma Case",

  // Other weapon cases
  "Snakebite Case",
  "Fracture Case",
  "Clutch Case",
  "CS20 Case",
  "Danger Zone Case",
  "Horizon Case",
  "Glove Case",
  "Shadow Case",
  "Falchion Case",
  "Revolver Case",
  "Huntsman Weapon Case",
  "Winter Offensive Weapon Case",

  // Original weapon cases
  "CS:GO Weapon Case 3",
  "CS:GO Weapon Case 2",
  "CS:GO Weapon Case",

  // eSports cases
  "eSports 2014 Summer Case",
  "eSports 2013 Winter Case",
  "eSports 2013 Case",
] as const;

export const STICKER_CAPSULES = [
  // Community sticker capsules
  "Community Sticker Capsule 1",
  "Sticker Capsule 2",
  "Sticker Capsule",

  // Autograph capsules and others can be added here
] as const;

export const ALL_CONTAINERS = [...ALL_CASES, ...STICKER_CAPSULES] as const;

export type CaseName = (typeof ALL_CASES)[number];
export type ContainerName = (typeof ALL_CONTAINERS)[number];
