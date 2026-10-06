// Solar Flareセットのregenはゲーム側で固有のハードコード扱いなので、
// これも愛のハードコード
const SOLAR_FLARE_PIECE_NAMES = new Set([
  "Solar Flare Helmet", "Solar Flare Breastplate", "Solar Flare Leggings"
]);

/**
 * 計算機の1セット分(頭/胴/足の防具、アクセサリー7枠、各枠のmenacing/warding、sakeトグル)の状態と
 * ステータス合計/効果一覧を持つクラス
 */
class ArmorSet {
  constructor() {
    this.head = null;
    this.body = null;
    this.legs = null;
    this.accessories = new Array(7).fill(null); // Accessoryインスタンス、空ならnull
    this.modifiers = new Array(7).fill("");     // "" | "menacing" | "warding"(accessoriesと同じ添字)
    this.sakeEnabled = false;
  }

  getArmorPieces() {
    // 装備中の防具(頭/胴/足のうちnull以外)を配列で返す
    return [this.head, this.body, this.legs].filter(Boolean);
  }

  hasDuplicateAccessory(name, excludeIndex) {
    // excludeIndex以外の枠に同じ名前のアクセサリーが既に入っているかを返す(boolean)
    return this.accessories.some((a, i) => i !== excludeIndex && a && a.name === name);
  }

  hasConflictingWing(excludeIndex) {
    // excludeIndex以外の枠にウィング系アクセサリーが既に入っているかを返す(boolean)
    return this.accessories.some((a, i) => i !== excludeIndex && a && a.hasWing());
  }

  sumStats() {
    // 防具+アクセサリー+modifier+sakeを全部合算したダメージ/防御ステータスを
    // { Defense, Melee, Magic, Ranged, Minion } の形で返す
    const stats = { Defense: 0, Melee: 0, Magic: 0, Ranged: 0, Minion: 0 };

    this.getArmorPieces().forEach(piece => {
      stats.Defense += piece.CurrentDefense || 0;
      stats.Melee += piece.CurrentMeleeDamagePercentage || 0;
      stats.Magic += piece.CurrentMagicDamagePercentage || 0;
      stats.Ranged += piece.CurrentRangedDamagePercentage || 0;
      stats.Minion += piece.CurrentMinionDamagePercentage || 0;
    });

    this.accessories.forEach((acc, i) => {
      if (!acc) return;
      stats.Defense += acc.getDefenseBonus();
      stats.Melee += acc.getDamageBonus("Melee");
      stats.Magic += acc.getDamageBonus("Magic");
      stats.Ranged += acc.getDamageBonus("Ranged");
      stats.Minion += acc.getDamageBonus("Minion");

      const mod = this.modifiers[i];
      if (mod === "menacing") {
        stats.Melee += 4; stats.Magic += 4; stats.Ranged += 4; stats.Minion += 4;
      } else if (mod === "warding") {
        stats.Defense += 4;
      }
    });

    if (this.sakeEnabled) {
      stats.Defense -= 4;
      stats.Melee += 10;
    }

    return stats;
  }

  sumEffects() {
    // ダメージ/防御以外の効果(regen/DR/ポーション短縮/ダッシュ/飛行)をまとめて
    // { regen, dr, potionCooldown, dash, wing } の形で返す
    // 同じgroupを持つアクセサリーは複数装備しても代表1つ分の効果しか加算しない
    const effects = { regen: 0, dr: 0, potionCooldown: false, dash: false, wing: false };
    const seenGroups = new Set();

    this.getArmorPieces().forEach(piece => {
      if (SOLAR_FLARE_PIECE_NAMES.has(piece.Name)) effects.regen += 1;
    });

    const applyEffect = (acc) => {
      // 1つのアクセサリーの効果をeffectsに加算する
      effects.regen += acc.getRegenBonus();
      effects.dr += acc.getDamageReduction();
      if (acc.hasPotionCooldownReduction()) effects.potionCooldown = true;
      if (acc.hasDash()) effects.dash = true;
      if (acc.hasWing()) effects.wing = true;
    };

    this.accessories.forEach(acc => {
      if (!acc) return;
      const group = acc.getGroup();

      if (group) {
        if (seenGroups.has(group)) return; // このグループは既に代表1つ分を反映済みなのでスキップ
        seenGroups.add(group);
      }

      applyEffect(acc);
    });

    return effects;
  }

  clone() {
    // このセットの内容を丸ごと複製した新しいArmorSetを返す(A->Bコピー機能用)
    const copy = new ArmorSet();
    copy.head = this.head;
    copy.body = this.body;
    copy.legs = this.legs;
    copy.accessories = this.accessories.slice();
    copy.modifiers = this.modifiers.slice();
    copy.sakeEnabled = this.sakeEnabled;
    return copy;
  }
}
