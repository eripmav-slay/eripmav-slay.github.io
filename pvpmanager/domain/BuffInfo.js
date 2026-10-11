/**
 * APIの生データ(武器/防具/アクセサリー)のバフ関連フィールドを、共通の形に揃えて持つクラス
 * フィールド名の違い(武器はHeldBuffs、防具/アクセサリーはEquippedBuffs)はBUFF_KINDSのfieldsで吸収する
 * バフを持たないアイテムも多いので、フィールドが無い/空の場合は空配列として扱う
 */
class BuffInfo {
  constructor(rawApiData) {
    // rawはAPIのレスポンスそのもの
    // entriesは kindのkey -> [{ id, ms }] の形
    this.entries = {};
    BUFF_KINDS.forEach(kind => {
      this.entries[kind.key] = kind.fields.flatMap(field =>
        (rawApiData[field] || []).map(b => ({ id: b.NetID, ms: b.Milliseconds }))
      );
    });
  }

  static hasBuffFields(rawApiData) {
    // 一覧APIの生データがバフ関連のフィールドを1つでも持っているか(空配列でも持っていればtrue)を返す
    return BUFF_KINDS.some(kind => kind.fields.some(field => field in rawApiData));
  }

  get(kindKey) {
    // 指定したkind("onHit"など)のバフ配列 [{ id, ms }] を返す(無ければ空配列)
    return this.entries[kindKey] || [];
  }

  hasAny() {
    // どのkindでも1つ以上バフを持っているかを返す(boolean)
    return BUFF_KINDS.some(kind => this.entries[kind.key].length > 0);
  }
}
