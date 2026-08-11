// 頭(head)防具の判定に使うデータ定義だけを置くファイル
// 分類ロジック(classifySlot)は app.js 側にあり、ここは参照するデータのみを持つ
//
// 2種類のリストに分けている:
//   1) HEAD_KEYWORDS   … 名前の一部にこの単語が含まれていれば頭防具とみなす汎用ワード
//                         (例: "Ancient Helm" は "helm" を含むのでヒットする)
//   2) HEAD_ITEM_NAMES … 汎用ワードでは拾えない、名前まるごとで頭防具と分かるアイテム
//                         (例: "Empty Bucket" は単語だけ見ても頭防具か分からないので個別指定)
//
// 新しい頭防具の単語やアイテムを追加したいときは、このファイルの該当する配列に追記するだけでいい

const HEAD_KEYWORDS = [
  "helmet", "helm", "headgear", "mask", "hood", "hat", "cap",
  "antlers", "horn", "headpiece", "hairpin", "wig", " Horns",
  "goggles", "sunglasses", "crown", "tiara", "skull", "ears",
  "circlet", "turban", "bandana", "veil", "aviators", "protector",
  "bonnet", "visor", "ribbon", "jingasa", "hairclip", "cowl", "headdress",
  "Shanter"
];

const HEAD_ITEM_NAMES = [
  "Jungle Rose",
  "Giant Bow",
  "Fez",
  "Eye Patch",
  "Beanie",
  "Fish Bowl",
  "Gold Fish Bowl",
  "Silly Sunflower Petals",
  "Fedora",
  "Safeman's Sunny Day",
  "Empty Bucket"
];
