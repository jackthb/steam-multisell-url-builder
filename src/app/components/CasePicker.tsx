"use client";

import { useState } from "react";

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

export function CasePicker() {
  const [items, setItems] = useState(CS_CASE_NAMES);
  const [custom, setCustom] = useState("");

  const baseUrl = `https://steamcommunity.com/market/multisell?appid=${CSGO_ID}&contextid=2`;
  const url = addAllItemsToUrl(items, baseUrl);

  return (
    <div>
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">CS:GO Case Picker</h1>
        <div>
          {!!items.length ? (
            <button
              onClick={() => setItems([])}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Deselect all
            </button>
          ) : (
            <button
              onClick={() => setItems(CS_CASE_NAMES)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Select all
            </button>
          )}
          <button className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <a href={url}>Open in Steam</a>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {CS_CASE_NAMES.map((item) => (
          <div key={item}>
            <label>
              <input
                className="mr-2"
                type="checkbox"
                checked={items.includes(item)}
                onChange={() => {
                  if (items.includes(item)) {
                    setItems(items.filter((i) => i !== item));
                  } else {
                    setItems([...items, item]);
                  }
                }}
              />
              {item}
            </label>
          </div>
        ))}
        <div className="flex">
          <input
            className="border border-gray-300 rounded-md p-2 mr-4"
            type="text"
            placeholder="Add a case"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setItems([...items, custom])}
          >
            Add
          </button>
        </div>
      </div>

      <a
        className={`break-words hover:underline hover:text-blue-400`}
        href={url}
      >
        {url}
      </a>
    </div>
  );
}
