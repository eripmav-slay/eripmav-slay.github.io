/**
 * 1つのアクセサリーを表すクラス
 * APIの生データ(raw)と、AccessoryEffectRegistryから
 * 引いた追加効果(effects)をまとめて持っている
 * UI側が生フィールド名(raw.CurrentMeleeDamagePercentage)を直接触らずに済むように
 */
class Accessory {
  constructor(rawApiData, effects) {
    // rawはAPIのレスポンスそのもの(Name, NetID, CurrentDefense)
    // effectsはRegistryの返り値。
    this.raw = rawApiData;
    this.effects = effects;
  }

  get name() {
    // 表示名を返す(検索・突き合わせのキーにする)
    return this.raw.Name;
  }

  get netId() {
    // NetIDを返す(アイコン画像URLの組み立てなどに使う)
    return this.raw.NetID;
  }

  get isBanned() {
    // settings.BannedEquipmentのIDリストから付与されたBan状態を返す(boolean)
    return !!this.raw.Banned;
  }

  getDamageBonus(damageType) {
    // damageTypeは "Melee" / "Magic" / "Ranged" / "Minion"
    // クラスダメージ%を返す(number)
    return this.raw[`Current${damageType}DamagePercentage`] || 0;
  }

  getDefenseBonus() {
    // 防御力のボーナスを返す(number)
    return this.raw.CurrentDefense || 0;
  }

  hasWing() {
    // ウィング系(同時装備不可)かどうかを返す(boolean)
    return this.effects.wing;
  }

  hasDash() {
    // ダッシュ効果を持つかどうかを返す(boolean)
    return this.effects.dash;
  }

  hasPotionCooldownReduction() {
    // ポーションCT25%短縮する効果を持つかどうかを返す(boolean)
    return this.effects.potionCooldown;
  }

  getRegenBonus() {
    // regenの加算量を返す(number)
    return this.effects.regen;
  }

  getDamageReduction() {
    // DR%を返す(number)
    return this.effects.dr;
  }
  getGroup() {
    // 同時装備しても効果が1個分しか乗らない排他グループ名を返す(無ければnull)
    return this.effects.group;
  }
}
