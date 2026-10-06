// 表示(テーブル描画)/フィルタ/タブ切替/防具スロット分類だけを担当するファイル
// データ取得           ->data-fetch.js (BASE/IMG_BASE/CATS/store/loadAll)
// 防具計算機           ->calculator.js
// アクセサリー追加情報 ->accessories.js

let currentCat = "weapons";
let sortState = { weapons: {col:"Name", dir:1}, armorPieces:{col:"Name", dir:1}, accessories:{col:"Name", dir:1}, projectiles:{col:"Name", dir:1} };

let bannedFilter = "hide"; // hide / only / all

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    currentCat = t.dataset.cat;
    document.getElementById("toolbar").style.display = currentCat === "calculator" ? "none" : "flex";
    if(currentCat !== "calculator"){
      document.getElementById("search").value = "";
      populateTypeFilter();
      populateSlotFilter();
    }
    render();
  });
});

function setWidth(px){
  document.getElementById("main").style.maxWidth = px + "px";
}

function toggleShowBanned(){
  bannedFilter = bannedFilter === "hide" ? "only" : bannedFilter === "only" ? "all" : "hide";
  const chip = document.getElementById("bannedChip");
  chip.classList.toggle("on", bannedFilter !== "hide");
  chip.classList.toggle("only", bannedFilter === "only");
  chip.textContent =
    bannedFilter === "hide" ? "Banned Only" :
    bannedFilter === "only" ? "Show All" : "Hide Banned";
  render();
}

function getColumns(catKey){
  if(catKey === "weapons"){
    return [
      {k:"_icon", label:"", type:"icon"},
      {k:"Name", label:"Name", type:"str"},
      {k:"WeaponType", label:"Type", type:"badge"},
      {k:"CurrentDamage", label:"Damage", type:"effnum", base:"BaseDamage"},
      {k:"MinDamage", label:"Min Damage", type:"num"},
      {k:"MaxDamage", label:"Max Damage", type:"num"},
      {k:"CurrentVelocity", label:"Velocity", type:"effnum", base:"BaseVelocity"},
      {k:"NetID", label:"NetID", type:"num"},
      {k:"Banned", label:"Banned", type:"bool"}
    ];
  }
  if(catKey === "armorPieces"){
    return [
      {k:"_icon", label:"", type:"icon"},
      {k:"Name", label:"名前", type:"str"},
      {k:"CurrentDefense", label:"Defense", type:"effnum", base:"BaseDefense"},
      {k:"CurrentMeleeDamagePercentage", label:"Melee%", type:"effnum", base:"BaseMeleeDamagePercentage"},
      {k:"CurrentMagicDamagePercentage", label:"Magic%", type:"effnum", base:"BaseMagicDamagePercentage"},
      {k:"CurrentRangedDamagePercentage", label:"Ranged%", type:"effnum", base:"BaseRangedDamagePercentage"},
      {k:"CurrentMinionDamagePercentage", label:"Minion%", type:"effnum", base:"BaseMinionDamagePercentage"},
      {k:"NetID", label:"NetID", type:"num"}
    ];
  }
  if(catKey === "accessories"){
    return [
      {k:"_icon", label:"", type:"icon"},
      {k:"Name", label:"名前", type:"str"},
      {k:"CurrentDefense", label:"Defense", type:"effnum", base:"BaseDefense"},
      {k:"CurrentMeleeDamagePercentage", label:"Melee%", type:"effnum", base:"BaseMeleeDamagePercentage"},
      {k:"CurrentMagicDamagePercentage", label:"Magic%", type:"effnum", base:"BaseMagicDamagePercentage"},
      {k:"CurrentRangedDamagePercentage", label:"Ranged%", type:"effnum", base:"BaseRangedDamagePercentage"},
      {k:"CurrentMinionDamagePercentage", label:"Minion%", type:"effnum", base:"BaseMinionDamagePercentage"},
      {k:"NetID", label:"NetID", type:"num"}
    ];
  }
  return [
    {k:"Name", label:"名前", type:"str"},
    {k:"DamageRatio", label:"Dmg 倍率", type:"num"},
    {k:"VelocityRatio", label:"Vel 倍率", type:"num"},
    {k:"MinDamage", label:"Min Damage", type:"num"},
    {k:"MaxDamage", label:"Max Damage", type:"num"},
    {k:"Banned", label:"Banned", type:"bool"}
  ];
}

function populateTypeFilter(){
  const sel = document.getElementById("typeFilter");
  sel.innerHTML = "";
  if(currentCat !== "weapons"){
    sel.style.display = "none";
    return;
  }
  sel.style.display = "inline-block";
  const types = new Set();
  Object.values(store.weapons).forEach(w => types.add(w.WeaponType || "不明"));
  const opts = ['<option value="">全タイプ</option>'].concat(
    [...types].sort().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
  );
  sel.innerHTML = opts.join("");
}

function populateSlotFilter(){
  const sel = document.getElementById("slotFilter");
  if(currentCat !== "armorPieces"){
    sel.style.display = "none";
    sel.value = "";
    return;
  }
  sel.style.display = "inline-block";
  const opts = [
    ["", "全部位(all slot)"],
    ["head", "頭(head)"],
    ["body", "胴(body)"],
    ["legs", "足(leg)"],
    ["other", "未分類(Uncategorized)"]
  ];
  sel.innerHTML = opts.map(([v,l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join("");
}

function render(){
  if(currentCat === "calculator"){ renderCalculator(); return; }
  const main = document.getElementById("main");
  const items = Object.values(store[currentCat] || {});
  if(!items.length){
    main.innerHTML = '<div class="empty">データがないよ。「データを取得/更新」を押してね。</div>';
    document.getElementById("count").textContent = "";
    return;
  }
  const cols = getColumns(currentCat);
  const q = document.getElementById("search").value.trim().toLowerCase();
  const typeF = currentCat === "weapons" ? document.getElementById("typeFilter").value : "";
  const slotF = currentCat === "armorPieces" ? document.getElementById("slotFilter").value : "";

  let filtered = items.filter(it => {
    if(bannedFilter === "hide" && it.Banned) return false;
    if(bannedFilter === "only" && !it.Banned) return false;
    if(q && !(it.Name||"").toLowerCase().includes(q)) return false;
    if(typeF && it.WeaponType !== typeF) return false;
    if(slotF && classifySlot(it.Name) !== slotF) return false;
    return true;
  });

  const st = sortState[currentCat];
  filtered.sort((a,b) => {
    let av = a[st.col], bv = b[st.col];
    if(typeof av === "string" || typeof bv === "string"){
      av = (av ?? "").toString().toLowerCase(); bv = (bv ?? "").toString().toLowerCase();
      return av < bv ? -1*st.dir : av > bv ? 1*st.dir : 0;
    }
    av = av ?? 0; bv = bv ?? 0;
    return (av - bv) * st.dir;
  });

  document.getElementById("count").textContent = `${filtered.length} / ${items.length} 件`;

  let html = '<table><thead><tr>';
  cols.forEach(c => {
    if(c.type === "icon"){ html += `<th></th>`; return; }
    const sorted = st.col === c.k;
    const arrow = sorted ? (st.dir === 1 ? "▲" : "▼") : "";
    const align = (c.type === "num" || c.type === "numdiff" || c.type === "effnum") ? "text-align:right;" : "";
    html += `<th style="${align}" class="${sorted?'sorted':''}" onclick="sortBy('${c.k}')">${c.label}<span class="arrow">${arrow}</span></th>`;
  });
  html += '</tr></thead><tbody>';

  filtered.forEach(it => {
    html += '<tr>';
    cols.forEach(c => {
      const v = it[c.k];
      if(c.type === "icon"){
        const src = `${IMG_BASE}${it.NetID}.png`;
        html += `<td class="icon"><img src="${escapeHtml(src)}" loading="lazy" onerror="this.style.display='none'"></td>`;
      } else if(c.type === "str"){
        html += `<td class="name">${escapeHtml(v ?? "")}</td>`;
      } else if(c.type === "badge"){
        html += `<td><span class="badge ${escapeHtml(v||'')}">${escapeHtml(v||'-')}</span></td>`;
      } else if(c.type === "bool"){
        html += `<td>${v ? '<span class="badge banned">BAN</span>' : '<span class="badge ok">OK</span>'}</td>`;
      } else if(c.type === "num"){
        html += `<td class="num">${escapeHtml(v === -1 || v === undefined ? '-' : v)}</td>`;
      } else if(c.type === "effnum"){
        const base = it[c.base];
        const shown = v === -1 || v === undefined ? '-' : v;
        let hint = "";
        if(typeof v === "number" && typeof base === "number" && v !== base && base !== -1){
          hint = `<span class="basehint">base ${escapeHtml(base)}</span>`;
        }
        html += `<td class="num">${escapeHtml(shown)}${hint}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  main.innerHTML = html;
}

function sortBy(col){
  const st = sortState[currentCat];
  if(st.col === col){ st.dir *= -1; } else { st.col = col; st.dir = 1; }
  render();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ---- 防具スロット分類 ----
const HEAD_ITEM_NAMES_LOWER = new Set(HEAD_ITEM_NAMES.map(s => s.toLowerCase()));
const HEAD_KEYWORD_REGEX = new RegExp(HEAD_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i");

const BODY_ITEM_NAMES_LOWER = new Set(BODY_ITEM_NAMES.map(s => s.toLowerCase()));
const BODY_KEYWORD_REGEX = new RegExp(BODY_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i");

const LEGS_ITEM_NAMES_LOWER = new Set(LEGS_ITEM_NAMES.map(s => s.toLowerCase()));
const LEGS_KEYWORD_REGEX = new RegExp(LEGS_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i");

function classifySlot(name){
  const n = (name||"").toLowerCase();
  if(HEAD_ITEM_NAMES_LOWER.has(n) || HEAD_KEYWORD_REGEX.test(n)) return "head";
  if(BODY_ITEM_NAMES_LOWER.has(n) || BODY_KEYWORD_REGEX.test(n)) return "body";
  if(LEGS_ITEM_NAMES_LOWER.has(n) || LEGS_KEYWORD_REGEX.test(n)) return "legs";
  return "other";
}

// 起動時に自動でデータ取得(loadAll は data-fetch.js)
loadAll();
