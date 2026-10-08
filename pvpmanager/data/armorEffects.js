// 防具セット固有の効果データ(APIのCurrentXXXフィールドには出てこないもの)
// Solar Flareセットのregenはゲーム側で固有のハードコード扱い
// nameはAPIのName(表示名)と完全一致させること
const SOLAR_FLARE_PIECE_NAMES = new Set([
  "Solar Flare Helmet", "Solar Flare Breastplate", "Solar Flare Leggings"
]);
const SOLAR_FLARE_REGEN_PER_PIECE = 1; // Solar Flareの防具1ピースごとに加算するregenの指定値
