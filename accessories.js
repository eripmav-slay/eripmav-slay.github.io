// アクセサリーの「APIに無い追加情報」だけを管理するファイル。
// melee/magic/ranged/minion/defense は /api/accessories から直接取れるようになったので、
// ここでは持たない。calculator.js 側でAPIデータとNameで突き合わせてマージする。
//
// 各プロパティ:
//   name            : APIの Name と完全一致させること(突き合わせのキー)
//   wing            : true の場合ウィング系として扱い、計算機では同時に1つしか選べない
//                      (Jump to fly は wing:true から自動的に表示される)
//   regen           : ライフリジェネ量(数値。0なら非表示)
//   dr              : ダメージ減少%(数値。0なら非表示)
//   potionCooldown  : true で「ポーション再使用までの時間25%短縮」を表示
//   doubleTapDash   : true で「ダブルタップでダッシュ」を表示
//
// regen / dr は全部プレースホルダーの 0 になってるので、実際のPvPバランス値に書き換えてください。
// potionCooldown / doubleTapDash / wing は仕様上ほぼ固定のものだけ true にしてあります。

const ACCESSORIES = [
  { name:"Solar Wings",           wing:true,  regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Empress Wings",         wing:true,  regen:0, dr:0, potionCooldown:false, doubleTapDash:false },

  { name:"Celestial Shell",       wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Warrior Emblem",        wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Fire Gauntlet",         wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Mechanical Glove",      wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Berserker's Glove",     wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Ranger Emblem",         wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Recon Scope",           wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Celestial Emblem",      wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Sorcerer Emblem",       wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Summoner Emblem",       wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Hercules Beetle",       wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Necromantic Scroll",    wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Apprentice's Scarf",    wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Monk's Belt",           wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Huntress's Buckler",    wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Squire's Shield",       wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:true  },
  { name:"Avenger Emblem",        wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Destroyer Emblem",      wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Worm Scarf",            wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Shield of Cthulhu",     wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:true  },
  { name:"Paladin's Shield",      wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:true  },
  { name:"Flesh Knuckles",        wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:false },
  { name:"Hero Shield",           wing:false, regen:0, dr:0, potionCooldown:false, doubleTapDash:true  },
  { name:"Charm of Myths",        wing:false, regen:0, dr:0, potionCooldown:true,  doubleTapDash:false },
];
