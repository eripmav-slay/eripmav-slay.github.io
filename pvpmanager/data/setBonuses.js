// 防具セットの定義 プリセット入力(セットを装備ボタン)とセットボーナスの両方に使う
// 値はterraria.wiki.ggの防具ページ(バニラ)から転記したもの サーバー独自の値に合わせて直すこと
// 名前はAPIのNameと完全一致させる データに無い名前は読み込み時にコンソールへ警告する
//
// heads: 頭の名前の配列 同じ胴/足でも頭でボーナスが変わるものは別エントリに分ける
// body/legs: 胴/足の名前
// bonus: 省略するとプリセット入力だけに使う
//   all: 全ダメージ% / melee / magic / ranged / minion: 各ダメージ% / dr: ダメージ軽減%
//
// Beetleの虫の数やSolarの盾の段階のように変動する効果と、
// 立ち止まった時だけ発動するShroomite/Vortexのステルスは入れていない
const SET_BONUS_DATA = [
  // Pre-Hardmode
  { label: "Pumpkin", heads: ["Pumpkin Helmet"], body: "Pumpkin Breastplate", legs: "Pumpkin Leggings",
    bonus: { all: 10 } },
  { label: "Bee", heads: ["Bee Headgear"], body: "Bee Breastplate", legs: "Bee Greaves",
    bonus: { minion: 10 } },
  { label: "Obsidian", heads: ["Obsidian Outlaw Hat"], body: "Obsidian Longcoat", legs: "Obsidian Pants",
    bonus: { minion: 15 } },
  { label: "Molten", heads: ["Molten Helmet"], body: "Molten Breastplate", legs: "Molten Greaves",
    bonus: { melee: 10 } },

  // Hardmode
  { label: "Hallowed", heads: ["Hallowed Mask", "Hallowed Helmet", "Hallowed Headgear", "Hallowed Hood"],
    body: "Hallowed Plate Mail", legs: "Hallowed Greaves" },
  { label: "Chlorophyte (Mask)", heads: ["Chlorophyte Mask"],
    body: "Chlorophyte Plate Mail", legs: "Chlorophyte Greaves", bonus: { dr: 5 } },
  { label: "Chlorophyte", heads: ["Chlorophyte Headgear", "Chlorophyte Helmet"],
    body: "Chlorophyte Plate Mail", legs: "Chlorophyte Greaves" },
  { label: "Turtle", heads: ["Turtle Helmet"], body: "Turtle Scale Mail", legs: "Turtle Leggings",
    bonus: { dr: 15 } },
  { label: "Beetle (Scale Mail)", heads: ["Beetle Helmet"], body: "Beetle Scale Mail", legs: "Beetle Leggings" },
  { label: "Beetle (Shell)", heads: ["Beetle Helmet"], body: "Beetle Shell", legs: "Beetle Leggings" },
  { label: "Shroomite", heads: ["Shroomite Headgear", "Shroomite Helmet", "Shroomite Mask"],
    body: "Shroomite Breastplate", legs: "Shroomite Leggings" },
  { label: "Spectre (Hood)", heads: ["Spectre Hood"], body: "Spectre Robe", legs: "Spectre Pants",
    bonus: { magic: -40 } },
  { label: "Spectre (Mask)", heads: ["Spectre Mask"], body: "Spectre Robe", legs: "Spectre Pants" },
  { label: "Titanium", heads: ["Titanium Mask", "Titanium Helmet", "Titanium Headgear"],
    body: "Titanium Breastplate", legs: "Titanium Leggings" },
  { label: "Adamantite", heads: ["Adamantite Mask", "Adamantite Helmet", "Adamantite Headgear"],
    body: "Adamantite Breastplate", legs: "Adamantite Leggings" },
  { label: "Frost", heads: ["Frost Helmet"], body: "Frost Breastplate", legs: "Frost Leggings",
    bonus: { melee: 10, ranged: 10 } },
  { label: "Spider", heads: ["Spider Mask"], body: "Spider Breastplate", legs: "Spider Greaves",
    bonus: { minion: 12 } },
  { label: "Spooky", heads: ["Spooky Helmet"], body: "Spooky Breastplate", legs: "Spooky Leggings",
    bonus: { minion: 25 } },
  { label: "Crystal Assassin", heads: ["Crystal Assassin Hood"],
    body: "Crystal Assassin Shirt", legs: "Crystal Assassin Pants", bonus: { all: 10 } },
  { label: "Forbidden", heads: ["Forbidden Mask"], body: "Forbidden Robes", legs: "Forbidden Treads" },

  // Lunar
  { label: "Solar Flare", heads: ["Solar Flare Helmet"], body: "Solar Flare Breastplate", legs: "Solar Flare Leggings" },
  { label: "Vortex", heads: ["Vortex Helmet"], body: "Vortex Breastplate", legs: "Vortex Leggings" },
  { label: "Nebula", heads: ["Nebula Helmet"], body: "Nebula Breastplate", legs: "Nebula Leggings" },
  { label: "Stardust", heads: ["Stardust Helmet"], body: "Stardust Plate", legs: "Stardust Leggings" },
];
