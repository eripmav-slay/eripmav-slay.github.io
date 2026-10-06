/**
 * 計算機(セットA/B、防具+アクセサリー入力、結果表示)の状態とDOM
 * escapeHtml() は utils.js で定義されている関数
 */
class CalculatorView {
  constructor(dataStore, slotClassifier, container) {
    this.dataStore = dataStore;
    this.slotClassifier = slotClassifier;
    this.container = container;
    this.sets = { A: new ArmorSet(), B: new ArmorSet() };
  }

  getArmorPool(bannedFilter) {
    // Banフィルタ("hide"/"only"/"all")を適用した候補の配列を返す
    return Object.values(this.dataStore.armorPieces)
      .filter(a => bannedFilter !== "hide" || !a.Banned);
  }

  getAccessoryPool(bannedFilter) {
    // Banフィルタ候補(Accessoryインスタンス)の配列を返す
    return Object.values(this.dataStore.accessories)
      .filter(a => bannedFilter !== "hide" || !a.isBanned);
  }

  render(bannedFilter) {
    // 計算機全体のHTMLを組み立ててcontainerに描画
    // 防具データが無ければ案内文のみ表示
    const armorPool = this.getArmorPool(bannedFilter);
    if (!armorPool.length) {
      this.container.innerHTML = '<div class="empty">先に「データを取得/更新」で防具データを取得してね。</div>';
      return;
    }
    const accessoryPool = this.getAccessoryPool(bannedFilter);

    this.container.innerHTML = `
      <div class="calc-wrap">
        ${this._renderSetPanel("A", armorPool, accessoryPool)}
        <div class="calc-copy-controls">
          <button onclick="app.copyCalcSet('A','B')">A-&gt;B</button>
          <button onclick="app.copyCalcSet('B','A')">B-&gt;A</button>
        </div>
        ${this._renderSetPanel("B", armorPool, accessoryPool)}
      </div>
      <div class="calc-result" id="calcResult"></div>
    `;
    this.renderResult();
  }

  _renderSetPanel(setId, armorPool, accessoryPool) {
    // 1セット分(頭/胴/足の入力欄+アクセサリー7枠+sake)のHTML文字列を返す
    const set = this.sets[setId];
    const slots = [["head", "頭(head)"], ["body", "胴(body)"], ["legs", "足(leg)"]];

    const armorRows = slots.map(([slot, label]) => `
      <div class="calc-row">
        <label>${label}</label>
        <input type="text" list="dl-${setId}-${slot}" placeholder="名前で検索..." value="${escapeHtml(set[slot]?.Name || '')}" data-set="${setId}" data-slot="${slot}" oninput="app.onCalcArmorInput(this)">
        <datalist id="dl-${setId}-${slot}">
          ${armorPool.filter(a => this.slotClassifier.classify(a.Name) === slot).sort((a, b) => a.Name.localeCompare(b.Name)).map(a => `<option value="${escapeHtml(a.Name)}">`).join("")}
        </datalist>
      </div>`).join("");

    const accessoryRows = set.accessories.map((_, i) => `
      <div class="calc-row calc-acc-row">
        <input type="text" list="dl-${setId}-acc-${i}" placeholder="アクセサリー ${i + 1}" value="${escapeHtml(set.accessories[i]?.name || '')}" data-set="${setId}" data-accidx="${i}" oninput="app.onCalcAccessoryInput(this)">
        <datalist id="dl-${setId}-acc-${i}">
          ${accessoryPool.slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => `<option value="${escapeHtml(a.name)}">`).join("")}
        </datalist>
        <select data-set="${setId}" data-accidx="${i}" onchange="app.onCalcModifierChange(this)">
          <option value="" ${set.modifiers[i] === "" ? "selected" : ""}>-</option>
          <option value="menacing" ${set.modifiers[i] === "menacing" ? "selected" : ""}>menacing (+4% dmg)</option>
          <option value="warding" ${set.modifiers[i] === "warding" ? "selected" : ""}>warding (+4 def)</option>
        </select>
      </div>`).join("");

    return `<div class="calc-set"><h3>set${setId}</h3>${armorRows}
      <label class="calc-toggle">
        <input type="checkbox" ${set.sakeEnabled ? "checked" : ""} onchange="app.onSakeToggle('${setId}', this.checked)">
        enable sake (Def -4, Melee +10%)
      </label>
      <h3 class="calc-acc-heading">アクセサリー(最大7)</h3>
      ${accessoryRows}
    </div>`;
  }

  onArmorInput(setId, slot, value, bannedFilter) {
    // 頭/胴/足の入力を受けてArmorSetを更新する。Ban済みアイテムは拒否してfalseを返す。
    // 反映できた場合はtrueを返す(呼び出し側で入力欄の表示を戻すかの判断に使う)。
    const pool = this.getArmorPool(bannedFilter);
    const match = pool.find(a => a.Name === value && this.slotClassifier.classify(a.Name) === slot);

    if (match && match.Banned) {
      alert(`${match.Name}\nBanされてるアイテムは計算機に入れられないよ`);
      return false;
    }

    this.sets[setId][slot] = match || null;
    this.renderResult();
    return true;
  }

  onAccessoryInput(setId, index, value, bannedFilter) {
    // アクセサリー入力を受けて重複/ウィング競合をチェックし、問題なければArmorSetに反映する。
    // 反映できた場合はtrue、重複/競合で弾いた場合はfalseを返す(入力欄の表示を戻すかの判断用)。
    const set = this.sets[setId];
    const match = this.getAccessoryPool(bannedFilter).find(a => a.name === value);

    if (match) {
      if (match.isBanned) {
        alert(`${match.name}\nBanされてるアイテムは計算機に入れられないよ`);
        return false;
      }
      if (set.hasDuplicateAccessory(match.name, index)) {
        alert(`${match.name}\n同時に装備できないよ(cannot equip the same item)`);
        return false;
      }
      if (match.hasWing() && set.hasConflictingWing(index)) {
        alert(`wingは一種類のみだよ(There is only one type of wing)`);
        return false;
      }
    }

    set.accessories[index] = match || null;
    this.renderResult();
    return true;
  }

  onModifierChange(setId, index, value) {
    // menacing/warding選択を反映
    this.sets[setId].modifiers[index] = value;
    this.renderResult();
  }

  onSakeToggle(setId, checked) {
    // sakeトグルの状態を反映
    this.sets[setId].sakeEnabled = checked;
    this.renderResult();
  }

  copySet(fromId, toId, bannedFilter) {
    // fromセットの内容をtoセットに、計算機タブ全体を再描画
    this.sets[toId] = this.sets[fromId].clone();
    this.render(bannedFilter);
  }

  renderResult() {
    // 比較結果テーブル(ステータス合計+その他効果)を再描画
    const box = document.getElementById("calcResult");
    if (!box) return;

    const statsA = this.sets.A.sumStats();
    const statsB = this.sets.B.sumStats();
    const statRows = [
      ["防御力 (Defense)", statsA.Defense, statsB.Defense],
      ["近接ダメージ% (Melee)", statsA.Melee, statsB.Melee],
      ["魔法ダメージ% (Magic)", statsA.Magic, statsB.Magic],
      ["遠隔ダメージ% (Ranged)", statsA.Ranged, statsB.Ranged],
      ["ミニオンダメージ% (Minion)", statsA.Minion, statsB.Minion]
    ].filter(([, av, bv]) => av || bv);

    const diffClass = (x, y) => x === y ? "" : (x > y ? "calc-diff-pos" : "calc-diff-neg");

    let html = '<table><thead><tr><th>項目</th><th style="text-align:right;">セットA</th><th style="text-align:right;">セットB</th></tr></thead><tbody>';
    if (!statRows.length) html += `<tr><td colspan="3" class="calc-misc-empty">まだ何も選ばれていないよ</td></tr>`;
    statRows.forEach(([label, av, bv]) => {
      html += `<tr><td>${escapeHtml(label)}</td><td class="num ${diffClass(av, bv)}">${escapeHtml(av)}</td><td class="num ${diffClass(bv, av)}">${escapeHtml(bv)}</td></tr>`;
    });

    const effectsA = this.sets.A.sumEffects();
    const effectsB = this.sets.B.sumEffects();
    const effectRows = [
      ["Regen", effectsA.regen, effectsB.regen, v => `+${v}`],
      ["DR", effectsA.dr, effectsB.dr, v => `+${v}%`],
      ["Life Potion CT", effectsA.potionCooldown, effectsB.potionCooldown, () => "cut25%"],
      ["Dash", effectsA.dash, effectsB.dash, () => "Can Dash"],
      ["Wing", effectsA.wing, effectsB.wing, () => "jump to fly"]
    ].filter(([, av, bv]) => av || bv);

    if (effectRows.length) {
      html += `<tr class="calc-subhead"><td colspan="3">その他(misc)</td></tr>`;
      effectRows.forEach(([label, av, bv, fmt]) => {
        html += `<tr><td>${escapeHtml(label)}</td><td class="num">${av ? escapeHtml(fmt(av)) : '-'}</td><td class="num">${bv ? escapeHtml(fmt(bv)) : '-'}</td></tr>`;
      });
    }

    html += '</tbody></table>';
    box.innerHTML = html;
  }
}
