// 胴(body)防具の判定に使うデータ定義だけを置くファイル
// 分類ロジック(classifySlot)は app.js 側にあり、ここは参照するデータのみを持つ
//
// 2種類のリストに分けている:
//   1) BODY_KEYWORDS   … 名前の一部にこの単語が含まれていれば胴防具とみなす汎用ワード
//   2) BODY_ITEM_NAMES … 汎用ワードでは拾えない、名前まるごとで胴防具と分かるアイテム
//
// 新しい胴防具の単語やアイテムを追加したいときは、このファイルの該当する配列に追記するだけでいい

const BODY_KEYWORDS = [
  "breastplate", "chainmail", "plate mail", "scalemail", "scale mail",
  "robe", "shirt", "jerkin", "vest", "shell", "plating", "tunic", "torso",
  "dress", "gi", "top", "tops", "blouse", "cuirass", "suit", "hoodie",
  "garments", "jacket", "bodice", "apron", "plate", "uniform", "sweater",
  "coat", "spaulders", "chest", "cloak", "gown", "Chestplate", "Robes",
  "Longcoat", " Swimsuit", "Chestpiece"
];

const BODY_ITEM_NAMES = [
  "Dryad Coverings",
  "Kimono",
  "Lamia Wraps",
  "Leinfors' Excessive Style",
  "Mermaid Adornment",
  "Skiphs' Skin",
  "Superhero Costume"
];
