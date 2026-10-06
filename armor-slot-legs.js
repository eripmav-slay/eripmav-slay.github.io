// 足(legs)防具の判定に使うデータ定義だけを置くファイル
//   1) LEGS_KEYWORDS   … 名前の一部にこの単語が含まれていれば足防具とみなす汎用ワード
//   2) LEGS_ITEM_NAMES … 汎用ワードでは拾えない、名前まるごとで足防具と分かるアイテム

const LEGS_KEYWORDS = [
  "leggings", "greaves", "pants", "trousers", "leg", "Fancypants",
  "slacks", "tights", "bottom", "pantaloons", "tail", "loincloth",
  "finskirt", "treads", "swimshorts", "skirt", "shoes", "legs",
  "heels", "bottoms", "butt", "trunks", "geta", "Boots"
];

const LEGS_ITEM_NAMES = [
  "Djinn's Curse"
];
