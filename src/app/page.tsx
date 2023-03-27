import { Inter } from "next/font/google";

const CS_CASE_NAMES = [
  "Spectrum 2 Case",
  "Horizon Case",
  "Glove Case",
  "Shadow Case",
  "Falchion Case",
  "Chroma 2 Case",
  "Chroma Case",
  "Operation Vanguard Weapon Case",
  "eSports 2014 Summer Case",
  "Operation Breakout Weapon Case",
  "Huntsman Weapon Case",
  "Community Sticker Capsule 1",
  "Sticker Capsule 2",
  "Operation Phoenix Weapon Case",
  "CS:GO Weapon Case 3",
  "Sticker Capsule",
  "Winter Offensive Weapon Case",
  "eSports 2013 Winter Case",
  "CS:GO Weapon Case 2",
  "Operation Bravo Case",
  "eSports 2013 Case",
  "CS:GO Weapon Case",
  "Prisma 2 Case",
  "Prisma Case",
  "Danger Zone Case",
  "Spectrum Case",
  "Gamma 2 Case",
  "Gamma Case",
  "Dreams & Nightmares Case",
  "CS20 Case",
  "Clutch Case",
  "Fracture Case",
];

function addItem(itemName: string) {
  // string should look like this: "items[]=Spectrum 2 Case"
  // but URI encoded
  // "items%5B%5D=Spectrum%202%20Case"

  const encodedItemName = encodeURIComponent(itemName);
  const item = `items%5B%5D=${encodedItemName}`;
  return item;
}

function addAllItemsToUrl(items: string[], baseUrl: string) {
  const itemsString = items.map(addItem).join("&");
  return `${baseUrl}&${itemsString}`;
}

const CSGO_ID = 730;

export default function Home() {
  // const baseUrl = `https://steamcommunity.com/market/multisell?appid=${CSGO_ID}&contextid=2&items%5B%5D=Spectrum%202%20Case&items%5B%5D=Horizon%20Case&items%5B%5D=Glove%20Case&items%5B%5D=Shadow%20Case&items%5B%5D=Falchion%20Case&items%5B%5D=Chroma%202%20Case&items%5B%5D=Chroma%20Case&items%5B%5D=Operation%20Vanguard%20Weapon%20Case&items%5B%5D=eSports%202014%20Summer%20Case&items%5B%5D=Operation%20Breakout%20Weapon%20Case&items%5B%5D=Huntsman%20Weapon%20Case&items%5B%5D=Community%20Sticker%20Capsule%201&items%5B%5D=Sticker%20Capsule%202&items%5B%5D=Operation%20Phoenix%20Weapon%20Case&items%5B%5D=CS:GO%20Weapon%20Case%203&items%5B%5D=Sticker%20Capsule&items%5B%5D=Winter%20Offensive%20Weapon%20Case&items%5B%5D=eSports%202013%20Winter%20Case&items%5B%5D=CS:GO%20Weapon%20Case%202&items%5B%5D=Operation%20Bravo%20Case&items%5B%5D=eSports%202013%20Case&items%5B%5D=CS:GO%20Weapon%20Case&items%5B%5D=Prisma%202%20Case&items%5B%5D=Prisma%20Case&items%5B%5D=Danger%20Zone%20Case&items%5B%5D=Spectrum%20Case&items%5B%5D=Gamma%202%20Case&items%5B%5D=Gamma%20Case`;
  const baseUrl = `https://steamcommunity.com/market/multisell?appid=${CSGO_ID}&contextid=2`;

  const url = addAllItemsToUrl(CS_CASE_NAMES, baseUrl);

  return (
    <main>
      <div>
        <a style={{ wordBreak: "break-all" }} href={url}>
          {url}
        </a>
      </div>
    </main>
  );
}
