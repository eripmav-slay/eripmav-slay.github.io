/**
 * アクセサリーの追加効果(APIに無いもの)を名前で引けるようにするクラス
 * 効果の有無を判定するロジックはここに一本化する
 * 他の場所で個別に
 * effects?.xxx || false みたいな判定を書き散らかさないように気をつけろ！！
 */
class AccessoryEffectRegistry {
  constructor(effectDataList) {
    // Name -> 効果データ のMapを作っておく
    // 都度配列を検索しないようにするため
    this.byName = new Map(effectDataList.map(e => [e.name, e]));
  }

  getEffects(name) {
    // 指定した名前の追加効果をまとめて返す
    // 登録が無い名前でも必ず全プロパティ揃ったオブジェクトを返す(呼び出し側でundefinedチェックをしない)
    const found = this.byName.get(name);
    return {
      wing: found?.wing || false,
      regen: found?.regen || 0,
      dr: found?.dr || 0,
      potionCooldown: found?.potionCooldown || false,
      dash: found?.dash || false,
      group: found?.group || null
    };
  }

}
