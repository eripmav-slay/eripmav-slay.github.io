// 足(legs)防具の判定に使うデータ定義だけを置くファイル
// 分類ロジック(classifySlot)は app.js 側にあり、ここは参照するデータのみを持つ
//
// 2種類のリストに分けている:
//   1) LEGS_KEYWORDS   … 名前の一部にこの単語が含まれていれば足防具とみなす汎用ワード
//   2) LEGS_ITEM_NAMES … 汎用ワードでは拾えない、名前まるごとで足防具と分かるアイテム
//
// 新しい足防具の単語やアイテムを追加したいときは、このファイルの該当する配列に追記するだけでいい

const LEGS_KEYWORDS = [
  "leggings", "greaves", "pants", "trousers", "leg", "Fancypants",
  "slacks", "tights", "bottom", "pantaloons", "tail", "loincloth",
  "finskirt", "treads", "swimshorts", "skirt", "shoes", "legs",
  "heels", "bottoms", "butt", "trunks", "geta", "Boots"
];

const LEGS_ITEM_NAMES = [
  "Djinn's Curse"
];
