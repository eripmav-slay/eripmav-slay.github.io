/**
 * 一覧(武器/防具/アクセサリー/弾丸)の描画を担当
 * カテゴリごとのフィールド名は _getCategoryConfig() の中にだけ閉じ込めて、
 * render/sort/filterのロジック自体はカテゴリを意識しないようにするよ
 */
class TableView {
  constructor(dataStore, slotClassifier, container, buffRegistry) {
    this.dataStore = dataStore;
    this.slotClassifier = slotClassifier;
    this.container = container;
    this.buffRegistry = buffRegistry;
    this.sortState = {
      weapons: { col: "Name", dir: 1 },
      armorPieces: { col: "Name", dir: 1 },
      accessories: { col: "name", dir: 1 },
      projectiles: { col: "Name", dir: 1 },
      buffs: { col: "name", dir: 1 }
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
          { label: "Name", type: "str", sortKey: "Name", get: item => item.Name },
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
          { label: "Name", type: "str", sortKey: "name", get: item => item.name },
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
    if (catKey === "buffs") {
      // バフタブはDataStore.getBuffItems()の要素 { category, netId, name, banned, buffs } を扱う
      // バフ名でも検索できるように、getSearchExtraでバフ名を連結した文字列を返す
      return {
        getName: item => item.name,
        getBanned: item => item.banned,
        getSearchExtra: item => BUFF_KINDS
          .flatMap(kind => item.buffs.get(kind.key))
          .map(b => this.buffRegistry.getName(b.id).toLowerCase())
          .join("\n"),
        columns: [
          { label: "", type: "icon", get: item => item.netId },
          { label: "Name", type: "str", sortKey: "name", get: item => item.name },
          { label: "Category", type: "text", sortKey: "category", get: item => BUFF_CATEGORY_LABELS[item.category] },
          ...BUFF_KINDS.map(kind => ({
            label: kind.label, type: "buffs", sortKey: kind.key, kind,
            get: item => item.buffs.get(kind.key),
            sortValue: item => item.buffs.get(kind.key).length // 並べ替えはバフの個数で行う
          })),
          { label: "Banned", type: "bool", sortKey: "banned", get: item => item.banned }
        ]
      };
    }
    // projectiles
    return {
      getName: item => item.Name,
      getBanned: item => !!item.Banned,
      columns: [
        { label: "Name", type: "str", sortKey: "Name", get: item => item.Name },
        { label: "Dmg 倍率", type: "num", sortKey: "DamageRatio", get: item => item.DamageRatio },
        { label: "Vel 倍率", type: "num", sortKey: "VelocityRatio", get: item => item.VelocityRatio },
        { label: "Min Damage", type: "num", sortKey: "MinDamage", get: item => item.MinDamage },
        { label: "Max Damage", type: "num", sortKey: "MaxDamage", get: item => item.MaxDamage },
        { label: "Banned", type: "bool", sortKey: "Banned", get: item => item.Banned }
      ]
    };
  }

  populateTypeFilter(selectEl, catKey) {
    // weaponsならWeaponTypeの一覧、buffsならカテゴリ(武器/防具/アクセサリー)を選択肢に
    // それ以外では選択肢を空にして非表示
    if (catKey === "buffs") {
      selectEl.style.display = "inline-block";
      selectEl.innerHTML = ['<option value="">全種別(all category)</option>']
        .concat(Object.entries(BUFF_CATEGORY_LABELS).map(([v, l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`))
        .join("");
      return;
    }
    if (catKey !== "weapons") { selectEl.style.display = "none"; return; }
    selectEl.style.display = "inline-block";
    const types = new Set(Object.values(this.dataStore.weapons).map(w => w.WeaponType || "不明"));
    selectEl.innerHTML = ['<option value="">全タイプ(all type)</option>']
      .concat([...types].sort().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`))
      .join("");
  }

  populateSlotFilter(selectEl, catKey) {
    // armorPiecesなら部位、buffsなら付与タイミング(BUFF_KINDS)を選択肢に
    // それ以外では非表示
    if (catKey === "buffs") {
      selectEl.style.display = "inline-block";
      selectEl.innerHTML = ['<option value="">全タイミング(all kind)</option>']
        .concat(BUFF_KINDS.map(k => `<option value="${escapeHtml(k.key)}">${escapeHtml(k.label)}</option>`))
        .join("");
      return;
    }
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
    // buffsタブではtypeFilterをカテゴリ、slotFilterを付与タイミング(BUFF_KINDSのkey)として使う
    const items = catKey === "buffs" ? this.dataStore.getBuffItems() : Object.values(this.dataStore[catKey]);
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
      if (q && !config.getName(item).toLowerCase().includes(q) && !(config.getSearchExtra?.(item) || "").includes(q)) return false;
      if (catKey === "weapons" && options.typeFilter && item.WeaponType !== options.typeFilter) return false;
      if (catKey === "armorPieces" && options.slotFilter && this.slotClassifier.classify(item.Name) !== options.slotFilter) return false;
      if (catKey === "buffs" && options.typeFilter && item.category !== options.typeFilter) return false;
      if (catKey === "buffs" && options.slotFilter && !item.buffs.get(options.slotFilter).length) return false;
      return true;
    });

    const st = this.sortState[catKey];
    const sortCol = config.columns.find(c => c.sortKey === st.col);
    filtered.sort((a, b) => {
      const valueOf = item => !sortCol ? null : sortCol.sortValue ? sortCol.sortValue(item) : sortCol.get(item);
      let av = valueOf(a);
      let bv = valueOf(b);
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
      const classes = [sorted ? "sorted" : "", (c.type === "num" || c.type === "effnum") ? "th-num" : ""].filter(Boolean).join(" ");
      html += `<th class="${classes}" data-action="sort" data-cat="${catKey}" data-sort-key="${c.sortKey}">${c.label}<span class="arrow">${arrow}</span></th>`;
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
    if (column.type === "text") return `<td>${escapeHtml(v ?? "")}</td>`;
    if (column.type === "buffs") {
      return `<td>${v.map(b => this.buffRegistry.renderLine(b, column.kind.showDuration)).join("")}</td>`;
    }
    return `<td></td>`;
  }

  sortBy(catKey, sortKey) {
    // 指定カテゴリのソート列を切り替える(同じ列なら昇順/降順を反転)
    const st = this.sortState[catKey];
    if (st.col === sortKey) { st.dir *= -1; } else { st.col = sortKey; st.dir = 1; }
  }
}
