// 防具名から部位を判定するためのデータ
// SlotClassifierのコンストラクタに渡して使う
// *_ITEM_NAMES は完全一致させたい例外名(キーワードだけでは判定できないもの)を入れる場所
// 今後個別対応したい名前が出てきたらここに足せるようにする
const HEAD_ITEM_NAMES = [
  "Empty Bucket",
  "Fish Bowl",
  "Gold Fish Bowl",
  "Garland",
  "Giant Bow",
  "Ghostar's Soul Jar",
  "Safeman's Sunny Day",
  "Rabbit Perch",
  "Silly Sunflower Petals",
];
const HEAD_KEYWORDS = [
  "helmet", "headgear", "mask", "hood", "hat", "cap", "antlers", "horn", "headpiece", "hairpin", "wig",
  "Aviators", "Headdress", "Beanie", "Bandana", "Ears", "Tiara", "Visor", "Horns", "Turban", "Fez",
  "Fedora", "Eye Patch", "Eyebrella", "Protector", "Chester", "Helm", "Goggles", "Crown", "Sunglasses",
  "Shanter", "Head", "Visage", "Jingasa", "Veil", "Hairclip", "Skull", "Ribbon", "Cowl", "Bonnet", "Circlet",
];

const BODY_ITEM_NAMES = [
  "Ghostar's Garb",
  "Leinfors' Excessive Style",
  "FoodBarbarian's Wild Wolf Spaulders",
  "Lamia Wraps",
  "Royal Blouse",
  "Skiphs' Skin",
  "Superhero Costume",
  "Red Swimsuit",
  "Mermaid Adornment",
];
const BODY_KEYWORDS = [
  "breastplate", "chainmail", "plate mail", "scalemail", "scale mail", "robe", "shirt", "jerkin", "vest",
  "shell", "plating", "tunic", "torso", "dress", "gi", "Jacket", "Garments", "Bodice", "Gown", "Top",
  "Apron", "plate", "Chestplate","Uniform", "Kimono", "Robes", "Sweater", "Coat", "Coverings",
  "Chestpiece", "Blazer", "Cloak", "Longcoat", "Tops", "Suit", "Yukata", "Hoodie", "Cuirass",
];

const LEGS_ITEM_NAMES = [
  "Djinn's Curse",
];
const LEGS_KEYWORDS = [
  "leggings", "greaves", "pants", "trousers", "leg", "Slacks", "Tights", "Bottom", "Bottoms", "Geta",
  "Skirt", "Trunks", "Foot", "Butt", "Stockings", "Hooves", "Tail", "Loincloth", "Finskirt", "Fancypants",
  "Treads", "Swimshorts", "Legs", "Heels", "Shoes", "Pantaloons", "Boots", "Footwear",
];
