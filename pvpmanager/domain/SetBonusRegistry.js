/**
 * 防具セットの定義を頭の名前から引けるようにするクラス
 * プリセット入力(頭に対応するセットの検索)とセットボーナス(頭/胴/足が揃った判定)に使う
 */
class SetBonusRegistry {
  constructor(dataList) {
    this.entries = dataList.map(data => this._normalize(data));
    this.byHead = new Map();
    this.entries.forEach(entry => {
      entry.heads.forEach(head => {
        if (!this.byHead.has(head)) this.byHead.set(head, []);
        this.byHead.get(head).push(entry);
      });
    });
  }

  _normalize(data) {
    // allを各ダメージに展開して { melee, magic, ranged, minion, dr } を必ず全部持たせる
    const b = data.bonus || {};
    const all = b.all || 0;
    return {
      label: data.label,
      heads: data.heads,
      body: data.body,
      legs: data.legs,
      bonus: {
        melee: all + (b.melee || 0),
        magic: all + (b.magic || 0),
        ranged: all + (b.ranged || 0),
        minion: all + (b.minion || 0),
        dr: b.dr || 0
      }
    };
  }

  findByHead(headName) {
    // 頭の名前に対応するセット定義の配列を返す 無ければ空配列
    return this.byHead.get(headName) || [];
  }

  findComplete(headName, bodyName, legsName) {
    // 頭/胴/足が全部揃っているセット定義を返す 揃っていなければnull
    return this.findByHead(headName).find(e => e.body === bodyName && e.legs === legsName) || null;
  }

  formatBonus(entry) {
    // ボーナスを "Melee +10% / DR +15%" の文字列にして返す ボーナスが無ければ空文字
    const b = entry.bonus;
    const sign = v => `${v > 0 ? "+" : ""}${v}%`;
    const parts = [];

    const dmg = [b.melee, b.magic, b.ranged, b.minion];
    if (dmg[0] !== 0 && dmg.every(v => v === dmg[0])) {
      parts.push(`All Dmg ${sign(dmg[0])}`);
    } else {
      if (b.melee) parts.push(`Melee ${sign(b.melee)}`);
      if (b.magic) parts.push(`Magic ${sign(b.magic)}`);
      if (b.ranged) parts.push(`Ranged ${sign(b.ranged)}`);
      if (b.minion) parts.push(`Minion ${sign(b.minion)}`);
    }
    if (b.dr) parts.push(`DR ${sign(b.dr)}`);

    return parts.join(" / ");
  }

  findMissingNames(knownNames) {
    // 定義にあるのにknownNames(Set)に無い防具名の配列を返す typo検出用
    const missing = new Set();
    this.entries.forEach(entry => {
      [...entry.heads, entry.body, entry.legs].forEach(name => {
        if (!knownNames.has(name)) missing.add(name);
      });
    });
    return [...missing];
  }
}
