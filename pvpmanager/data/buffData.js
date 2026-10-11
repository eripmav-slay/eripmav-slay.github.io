// バフ/デバフ表示用のデータ
// APIのバフは { NetID, Milliseconds } でIDしか来ないので、IDから表示名を引く表をここに置く
// 名前が未確認のIDは表に無いまま「Buff #ID」で表示される(確認できたらここに足す)
const BUFF_NAMES = {
  20: "Poisoned",
  21: "Potion Sickness",
  25: "Tipsy",
  30: "Bleeding",
  31: "Confused",
  39: "Cursed Inferno",
  44: "Frostburn",
  69: "Ichor",
  70: "Venom",
  120: "Stinky",
  137: "Slimed",
  144: "Electrified",
  151: "Life Drain",
  160: "Dazed",
  196: "Withered Weapon",
  323: "Hellfire",
  324: "Frostbite",
  336: "Hearty Meal",
  399: "Zapped"
};

// バフの付与タイミングと付与先の種類
// fields: そのkindとして読むAPIのフィールド名(武器はHeldBuffs、防具/アクセサリーはEquippedBuffs)
// showDuration: 持続時間を表示するか(所持/装備中のMillisecondsは更新間隔なので表示しない)
const BUFF_KINDS = [
  { key: "onHit",      label: "On Hit -> Target",  fields: ["OnHitBuffs"],                 showDuration: true },
  { key: "onHitSelf",  label: "On Hit -> Self",    fields: ["OnHitSelfBuffs"],             showDuration: true },
  { key: "passive",    label: "While Held/Worn",   fields: ["HeldBuffs", "EquippedBuffs"], showDuration: true },
  { key: "onHurtSelf", label: "On Hurt -> Self",   fields: ["OnHurtSelfBuffs"],            showDuration: true }
];

// バフ詳細API(/buffs/{種別}/{netId}/{フィールド名})のパスに使う種別名(DataStoreのstoreKey -> API側の種別)
// アクセサリーも防具と同じarmorPieceのパスで取得する
const BUFF_API_KIND = {
  weapons: "weapon",
  armorPieces: "armorPiece",
  accessories: "armorPiece"
};

// バフ詳細APIで取得するフィールド名(API側の種別ごと)
// 武器はHeldBuffs、防具/アクセサリーはEquippedBuffs
const BUFF_API_FIELDS = {
  weapon: ["HeldBuffs", "OnHitBuffs", "OnHurtSelfBuffs", "OnHitSelfBuffs"],
  armorPiece: ["EquippedBuffs", "OnHitBuffs", "OnHurtSelfBuffs", "OnHitSelfBuffs"]
};

// バフタブの「種別」列/フィルタに出すカテゴリ名(DataStoreのstoreKey -> 表示名)
const BUFF_CATEGORY_LABELS = {
  weapons: "weapon",
  armorPieces: "armor",
  accessories: "accessorie"
};
