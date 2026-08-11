// アクセサリーのデータ管理ファイル
// api には無いデータなので手動管理
//
// 各プロパティ:
//   name            : 表示名(検索/選択に使う)
//   melee/magic/ranged/minion : ダメージ%ボーナス(数値。例: 10 なら+10%)
//   defense         : 防御力ボーナス(数値)
//   wing            : true の場合ウィング系として扱い、計算機では同時に1つしか選べない
//                      (Jump to fly は wing:true から自動的に表示されるので個別プロパティ不要)
//   regen           : ライフリジェネ量(数値 0なら非表示)
//   dr              : ダメージ減少%(数値 0なら非表示)
//   potionCooldown  : true で「ポーション再使用までの時間25%短縮」を表示
//   doubleTapDash   : true で「ダブルタップでダッシュ」を表示

const ACCESSORIES = [
  { name:"Solar Wings",           melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:true,  regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Empress Wings",         melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:true,  regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },

  { name:"Tabi",                  melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:true  },
  { name:"Shield of Cthulhu",     melee:0,  magic:0,  ranged:0,  minion:0,  defense:2,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:true  },

  { name:"Celestial Shell",       melee:10, magic:10, ranged:10, minion:10, defense:4,  wing:false, regen:1, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Avenger Emblem",        melee:12, magic:12, ranged:12, minion:12, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Destroyer Emblem",      melee:10, magic:10, ranged:10, minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Worm Scarf",            melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:17, potionCooldown:false, doubleTapDash:false },
  { name:"Hero Shield",           melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Charm of Myths",        melee:0,  magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:1, dr:0,  potionCooldown:true,  doubleTapDash:false },

  { name:"Warrior Emblem",        melee:15, magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Fire Gauntlet",         melee:12, magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Mechanical Glove",      melee:12, magic:0,  ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Berserker's Glove",     melee:0,  magic:0,  ranged:0,  minion:0,  defense:8,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },

  { name:"Ranger Emblem",         melee:0,  magic:0,  ranged:15, minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Recon Scope",           melee:0,  magic:0,  ranged:10, minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Sniper Scope",          melee:0,  magic:0,  ranged:10, minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },

  { name:"Celestial Emblem",      melee:0,  magic:15, ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Sorcerer Emblem",       melee:0,  magic:15, ranged:0,  minion:0,  defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },

  { name:"Summoner Emblem",       melee:0,  magic:0,  ranged:0,  minion:15, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Necromantic Scroll",    melee:0,  magic:0,  ranged:0,  minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Hercules Beetle",       melee:0,  magic:0,  ranged:0,  minion:15, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Apprentice's Scarf",    melee:0,  magic:0,  ranged:0,  minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Monk's Belt",           melee:0,  magic:0,  ranged:0,  minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Huntress's Buckler",    melee:0,  magic:0,  ranged:0,  minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Squire's Shield",       melee:0,  magic:0,  ranged:0,  minion:10, defense:0,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },

  { name:"Paladin's Shield",      melee:0,  magic:0,  ranged:0,  minion:0,  defense:6,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
  { name:"Flesh Knuckles",        melee:0,  magic:0,  ranged:0,  minion:0,  defense:8,  wing:false, regen:0, dr:0,  potionCooldown:false, doubleTapDash:false },
];

