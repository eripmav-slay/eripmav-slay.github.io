/**
 * 防具の名前から装備部位(head/body/legs)を判定するクラス
 * 完全一致リストとキーワード正規表現をコンストラクタで1回だけ組み立てて、
 * classify()は判定だけ
 */
class SlotClassifier {
  constructor(headNames, headKeywords, bodyNames, bodyKeywords, legsNames, legsKeywords) {
    this.headNames = new Set(headNames.map(s => s.toLowerCase()));
    this.headRegex = this._buildKeywordRegex(headKeywords);
    this.bodyNames = new Set(bodyNames.map(s => s.toLowerCase()));
    this.bodyRegex = this._buildKeywordRegex(bodyKeywords);
    this.legsNames = new Set(legsNames.map(s => s.toLowerCase()));
    this.legsRegex = this._buildKeywordRegex(legsKeywords);
  }

  _buildKeywordRegex(keywords) {
    // キーワード配列を、特殊文字をエスケープした単語境界つきの正規表現(大文字小文字無視)にして返す
    return new RegExp(keywords.map(w => `\\b${escapeRegex(w)}\\b`).join("|"), "i");
  }

  matchSlots(name) {
    // アイテム名が当たる部位を、判定の優先順(head→body→legs)で全て配列にして返す 当たらなければ空配列
    const n = (name || "").toLowerCase();
    const slots = [];
    if (this.headNames.has(n) || this.headRegex.test(n)) slots.push("head");
    if (this.bodyNames.has(n) || this.bodyRegex.test(n)) slots.push("body");
    if (this.legsNames.has(n) || this.legsRegex.test(n)) slots.push("legs");
    return slots;
  }

  classify(name) {
    // アイテム名を受け取り "head" | "body" | "legs" | "other" を返す(複数の部位に当たる時は先に当たった部位)
    return this.matchSlots(name)[0] || "other";
  }

  findIssues(names) {
    // 名前の配列を調べて { ambiguous, unclassified } を返す(誤分類の確認用)
    // ambiguous: 複数の部位に当たる名前の [{ name, slots }] classifyは先頭の部位にしてしまうので誤分類の疑い
    // unclassified: どの部位にも当たらない名前の配列
    const ambiguous = [];
    const unclassified = [];
    names.forEach(name => {
      const slots = this.matchSlots(name);
      if (slots.length > 1) ambiguous.push({ name, slots });
      if (!slots.length) unclassified.push(name);
    });
    return { ambiguous, unclassified };
  }
}
