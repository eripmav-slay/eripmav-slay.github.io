/**
 * 一覧(武器/防具/アクセサリー/弾丸)の描画を担当
 * カテゴリごとのフィールド名は _getCategoryConfig() の中にだけ閉じ込めて、
 * render/sort/filterのロジック自体はカテゴリを意識しないようにするよ
 */
class TableView {
  constructor(dataStore, slotClassifier, container) {
    this.dataStore = dataStore;
    this.slotClassifier = slotClassifier;
    this.container = container;
    this.sortState = {
      weapons: { col: "Name", dir: 1 },
      armorPieces: { col: "Name", dir: 1 },
      accessories: { col: "name", dir: 1 },
      projectiles: { col: "Name", dir: 1 }
    };
  }

  _getCategoryConfig(catKey) {
    // カテゴリごとの列定義(get/sortKey/type)と、名前/Ban状態の取り出し方を返す
    // 以降の処理は全部ここ経由でデータに触るため、フィールド名の違いはここにだけ出る
    if (catKey === "weapons") {
      return {
        getName: item => item.Name,
        getBanned: item => !!item.Banned,
        columns: [
          { label: "", type: "icon", get: item => item.NetID },
          { label: "Name", type: "str", sortKey: "Name", get: item => item.Name },
          { label: "Type", type: "badge", sortKey: "WeaponType", get: item => item.WeaponType },
          { label: "Damage", type: "effnum", sortKey: "CurrentDamage", get: item => item.CurrentDamage, base: item => item.BaseDamage },
          { label: "Min Damage", type: "num", sortKey: "MinDamage", get: item => item.MinDamage },
          { label: "Max Damage", type: "num", sortKey: "MaxDamage", get: item => item.MaxDamage },
          { label: "Velocity", type: "effnum", sortKey: "CurrentVelocity", get: item => item.CurrentVelocity, base: item => item.BaseVelocity },
          { label: "NetID", type: "num", sortKey: "NetID", get: item => item.NetID },
          { label: "Banned", type: "bool", sortKey: "Banned", get: item => item.Banned }
        ]
      };
    }
    if (catKey === "armorPieces") {
      return {
        getName: item => item.Name,
        getBanned: item => !!item.Banned,
        columns: [
          { label: "", type: "icon", get: item => item.NetID },
          { label: "名前", type: "str", sortKey: "Name", get: item => item.Name },
          { label: "Defense", type: "effnum", sortKey: "CurrentDefense", get: item => item.CurrentDefense, base: item => item.BaseDefense },
          { label: "Melee%", type: "effnum", sortKey: "CurrentMeleeDamagePercentage", get: item => item.CurrentMeleeDamagePercentage, base: item => item.BaseMeleeDamagePercentage },
          { label: "Magic%", type: "effnum", sortKey: "CurrentMagicDamagePercentage", get: item => item.CurrentMagicDamagePercentage, base: item => item.BaseMagicDamagePercentage },
          { label: "Ranged%", type: "effnum", sortKey: "CurrentRangedDamagePercentage", get: item => item.CurrentRangedDamagePercentage, base: item => item.BaseRangedDamagePercentage },
          { label: "Minion%", type: "effnum", sortKey: "CurrentMinionDamagePercentage", get: item => item.CurrentMinionDamagePercentage, base: item => item.BaseMinionDamagePercentage },
          { label: "NetID", type: "num", sortKey: "NetID", get: item => item.NetID },
          { label: "Banned", type: "bool", sortKey: "Banned", get: item => item.Banned }
        ]
      };
    }
    if (catKey === "accessories") {
      return {
        getName: item => item.name,
        getBanned: item => item.isBanned,
        columns: [
          { label: "", type: "icon", get: item => item.netId },
          { label: "名前", type: "str", sortKey: "name", get: item => item.name },
          { label: "Defense", type: "num", sortKey: "defense", get: item => item.getDefenseBonus() },
          { label: "Melee%", type: "num", sortKey: "melee", get: item => item.getDamageBonus("Melee") },
          { label: "Magic%", type: "num", sortKey: "magic", get: item => item.getDamageBonus("Magic") },
          { label: "Ranged%", type: "num", sortKey: "ranged", get: item => item.getDamageBonus("Ranged") },
          { label: "Minion%", type: "num", sortKey: "minion", get: item => item.getDamageBonus("Minion") },
          { label: "NetID", type: "num", sortKey: "netId", get: item => item.netId },
          { label: "Banned", type: "bool", sortKey: "banned", get: item => item.isBanned }
        ]
      };
    }
    // projectiles
    return {
      getName: item => item.Name,
      getBanned: item => !!item.Banned,
      columns: [
        { label: "名前", type: "str", sortKey: "Name", get: item => item.Name },
        { label: "Dmg 倍率", type: "num", sortKey: "DamageRatio", get: item => item.DamageRatio },
        { label: "Vel 倍率", type: "num", sortKey: "VelocityRatio", get: item => item.VelocityRatio },
        { label: "Min Damage", type: "num", sortKey: "MinDamage", get: item => item.MinDamage },
        { label: "Max Damage", type: "num", sortKey: "MaxDamage", get: item => item.MaxDamage },
        { label: "Banned", type: "bool", sortKey: "Banned", get: item => item.Banned }
      ]
    };
  }

  populateTypeFilter(selectEl, catKey) {
    // weaponsならWeaponTypeの一覧を選択肢に
    // weapons以外では選択肢を空にして非表示
    if (catKey !== "weapons") { selectEl.style.display = "none"; return; }
    selectEl.style.display = "inline-block";
    const types = new Set(Object.values(this.dataStore.weapons).map(w => w.WeaponType || "不明"));
    selectEl.innerHTML = ['<option value="">全タイプ(all type)</option>']
      .concat([...types].sort().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`))
      .join("");
  }

  populateSlotFilter(selectEl, catKey) {
    // armorPieces以外では非表示
    if (catKey !== "armorPieces") { selectEl.style.display = "none"; selectEl.value = ""; return; }
    selectEl.style.display = "inline-block";
    const opts = [
      ["", "全部位(all slot)"], ["head", "頭(head)"], ["body", "胴(body)"],
      ["legs", "足(leg)"], ["other", "未分類(Uncategorized)"]
    ];
    selectEl.innerHTML = opts.map(([v, l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join("");
  }

  render(catKey, options) {
    // 一覧タブを描画
    // optionsは { search, typeFilter, slotFilter, bannedFilter, countEl }
    const items = Object.values(this.dataStore[catKey]);
    if (!items.length) {
      this.container.innerHTML = '<div class="empty">データがないよ。「データを取得/更新」を押してね。</div>';
      if (options.countEl) options.countEl.textContent = "";
      return;
    }

    const config = this._getCategoryConfig(catKey);
    const q = (options.search || "").trim().toLowerCase();

    const filtered = items.filter(item => {
      if (options.bannedFilter === "hide" && config.getBanned(item)) return false;
      if (options.bannedFilter === "only" && !config.getBanned(item)) return false;
      if (q && !config.getName(item).toLowerCase().includes(q)) return false;
      if (catKey === "weapons" && options.typeFilter && item.WeaponType !== options.typeFilter) return false;
      if (catKey === "armorPieces" && options.slotFilter && this.slotClassifier.classify(item.Name) !== options.slotFilter) return false;
      return true;
    });

    const st = this.sortState[catKey];
    const sortCol = config.columns.find(c => c.sortKey === st.col);
    filtered.sort((a, b) => {
      let av = sortCol ? sortCol.get(a) : null;
      let bv = sortCol ? sortCol.get(b) : null;
      if (typeof av === "string" || typeof bv === "string") {
        av = (av ?? "").toString().toLowerCase(); bv = (bv ?? "").toString().toLowerCase();
        return av < bv ? -1 * st.dir : av > bv ? 1 * st.dir : 0;
      }
      av = av ?? 0; bv = bv ?? 0;
      return (av - bv) * st.dir;
    });

    if (options.countEl) options.countEl.textContent = `${filtered.length} / ${items.length} 件`;
    this.container.innerHTML = this._renderTable(config.columns, filtered, st, catKey);
  }

  _renderTable(columns, items, sortState, catKey) {
    // 列定義とデータ行からtable要素のHTMLを返す
    let html = '<table><thead><tr>';
    columns.forEach(c => {
      if (c.type === "icon") { html += `<th></th>`; return; }
      const sorted = sortState.col === c.sortKey;
      const arrow = sorted ? (sortState.dir === 1 ? "▲" : "▼") : "";
      const align = (c.type === "num" || c.type === "effnum") ? "text-align:right;" : "";
      html += `<th style="${align}" class="${sorted ? 'sorted' : ''}" data-action="sort" data-cat="${catKey}" data-sort-key="${c.sortKey}">${c.label}<span class="arrow">${arrow}</span></th>`;
    });
    html += '</tr></thead><tbody>';
    items.forEach(item => {
      html += '<tr>';
      columns.forEach(c => { html += this._renderCell(c, item); });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  _renderCell(column, item) {
    // 1セル分のHTMLを組み立てて返す
    // 列のtypeによって表示形式を切り替える処理
    const v = column.get(item);
    if (column.type === "icon") {
      const src = `${IMG_BASE}${v}.png`;
      return `<td class="icon"><img src="${escapeHtml(src)}" loading="lazy"></td>`;
    }
    if (column.type === "str") return `<td class="name">${escapeHtml(v ?? "")}</td>`;
    if (column.type === "badge") return `<td><span class="badge ${escapeHtml(v || '')}">${escapeHtml(v || '-')}</span></td>`;
    if (column.type === "bool") return `<td>${v ? '<span class="badge banned">BAN</span>' : '<span class="badge ok">OK</span>'}</td>`;
    if (column.type === "num") return `<td class="num">${escapeHtml(v === -1 || v === undefined ? '-' : v)}</td>`;
    if (column.type === "effnum") {
      const base = column.base ? column.base(item) : undefined;
      const shown = v === -1 || v === undefined ? '-' : v;
      let hint = "";
      if (typeof v === "number" && typeof base === "number" && v !== base && base !== -1) {
        hint = `<span class="basehint">base ${escapeHtml(base)}</span>`;
      }
      return `<td class="num">${escapeHtml(shown)}${hint}</td>`;
    }
    return `<td></td>`;
  }

  sortBy(catKey, sortKey) {
    // 指定カテゴリのソート列を切り替える(同じ列なら昇順/降順を反転)
    const st = this.sortState[catKey];
    if (st.col === sortKey) { st.dir *= -1; } else { st.col = sortKey; st.dir = 1; }
  }
}
