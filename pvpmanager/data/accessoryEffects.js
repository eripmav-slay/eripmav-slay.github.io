// APIのCurrentXXXフィールドには出てこない、アクセサリー固有の効果だけを列挙したデータ
// nameはAPIのName(表示名)と完全一致させること
// ここに無い名前は全部デフォルト(効果なし)扱いになるので注意
// 数値(name, wing, doubleTapDash, potionCooldown, regen, dr, group)
// group: 同じ文字列を持つもの同士は同時装備しても効果が1個分しか乗らない
const ACCESSORY_EFFECT_DATA = [
  { name: "Solar Wings",          wing: true, group: "wing" },
  { name: "Stardust Wings",       wing: true, group: "wing" },
  { name: "Empress Wings",        wing: true, group: "wing" },
  { name: "Betsy's Wings",        wing: true, group: "wing" },
  { name: "Fishron Wings",        wing: true, group: "wing" },

  { name: "Tabi",                 Dash: true, group: "dash" },
  { name: "Shield of Cthulhu",    Dash: true, group: "dash" },
  { name: "Master Ninja Gear",    Dash: true, group: "dash" },

  { name: "Worm Scarf",           dr: 17 },

  { name: "Sun Stone",            regen: 1, group: "celestial" },
  { name: "Moon Stone",           regen: 1, group: "celestial" },
  { name: "Moon Charm",           regen: 1, group: "celestial" },
  { name: "Celestial Stone",      regen: 1, group: "celestial" },
  { name: "Celestial Shell",      regen: 1, group: "celestial" },

  { name: "Restoration Shield",   regen: 1 },
  { name: "Band of Regeneration", regen: 1 },
  { name: "Shiny Stone",          regen: 2 },

  { name: "Charm of Myths",       potionCooldown: true, regen: 1, group: "potion" },
  { name: "Catalyst Band",        potionCooldown: true, group: "potion" },
  { name: "Philosopher's Stone",  potionCooldown: true, group: "potion" },
];
