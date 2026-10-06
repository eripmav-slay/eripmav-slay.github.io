/**
 * 防具の名前から装備部位(head/body/legs)を判定するクラス
 * 完全一致リストとキーワード正規表現をコンストラクタで1回だけ組み立てて、
 * classify()は判定だけ
 */
class SlotClassifier {
  constructor(headNames, headKeywords, bodyNames, bodyKeywords, legsNames, legsKeywords) {
    this.headNames = new Set(headNames.map(s => s.toLowerCase()));
    this.headRegex = new RegExp(headKeywords.map(w => `\\b${w}\\b`).join("|"), "i");
    this.bodyNames = new Set(bodyNames.map(s => s.toLowerCase()));
    this.bodyRegex = new RegExp(bodyKeywords.map(w => `\\b${w}\\b`).join("|"), "i");
    this.legsNames = new Set(legsNames.map(s => s.toLowerCase()));
    this.legsRegex = new RegExp(legsKeywords.map(w => `\\b${w}\\b`).join("|"), "i");
  }

  classify(name) {
    // アイテム名を受け取り "head" | "body" | "legs" | "other" を返す
    const n = (name || "").toLowerCase();
    if (this.headNames.has(n) || this.headRegex.test(n)) return "head";
    if (this.bodyNames.has(n) || this.bodyRegex.test(n)) return "body";
    if (this.legsNames.has(n) || this.legsRegex.test(n)) return "legs";
    return "other";
  }
}
