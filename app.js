const BASE = "https://pvpcapi.dark-gaming.com/api/";
const IMG_BASE = "https://pvpmanager.dark-gaming.com/img/item-";
const PAGE_SIZE = 104;
const CATS = {
  weapons: { endpoint: "weapons", key: "weapons" },
  armorPieces: { endpoint: "armorPieces", key: "armorPieces" },
  projectiles: { endpoint: "projectiles", key: "projectiles" }
};

let store = { weapons: {}, armorPieces: {}, projectiles: {} };
let currentCat = "weapons";
let sortState = { weapons: {col:"Name", dir:1}, armorPieces:{col:"Name", dir:1}, projectiles:{col:"Name", dir:1} };
let showBanned = false;

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    currentCat = t.dataset.cat;
    document.getElementById("toolbar").style.display = currentCat === "calculator" ? "none" : "flex";
    if(currentCat !== "calculator"){
      document.getElementById("search").value = "";
      populateTypeFilter();
    }
    render();
  });
});

function setWidth(px){
  document.getElementById("main").style.maxWidth = px + "px";
}

function toggleShowBanned(){
  showBanned = !showBanned;
  document.getElementById("bannedChip").classList.toggle("on", showBanned);
  render();
}

function setStatus(html){ document.getElementById("status").innerHTML = html; }

async function fetchAllPages(catKey){
  const cfg = CATS[catKey];
  let offset = 0;
  let all = [];
  while(true){
    const url = `${BASE}${cfg.endpoint}/all/${offset}/${PAGE_SIZE}`;
    let res;
    try{
      res = await fetch(url, {mode:"cors"});
    }catch(e){
      throw new Error(`ネットワークエラー: ${url}`);
    }
    if(!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`);
    const data = await res.json();
    const list = data[cfg.key] || [];
    all = all.concat(list);
    if(list.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    if(offset > 5000) break;
  }
  return all;
}

async function loadAll(){
  const btn = document.getElementById("refreshBtn");
  btn.disabled = true;
  setStatus('<span class="spinner"></span> 読み込み中...');
  let errors = [];
  for(const catKey of Object.keys(CATS)){
    try{
      setStatus(`<span class="spinner"></span> 読み込み中 (${catKey})...`);
      const items = await fetchAllPages(catKey);
      const map = {};
      items.forEach(it => { map[it.NetID ?? it._id] = it; });
      store[catKey] = map;
    }catch(e){
      errors.push(`${catKey}: ${e.message}`);
    }
  }
  btn.disabled = false;
  setStatus("");
  if(errors.length){
    showFetchError(errors);
  }
  populateTypeFilter();
  render();
}

function showFetchError(errors){
  const main = document.getElementById("main");
  const div = document.createElement("div");
  div.className = "panel-msg";
  div.innerHTML = `直接取得に失敗した項目があるよ<br>
  ${errors.map(e=>`・${escapeHtml(e)}`).join("<br>")}`;
  main.prepend(div);
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

function render(){
  if(currentCat === "calculator"){ renderCalculator(); return; }
  const main = document.getElementById("main");
  const items = Object.values(store[currentCat]);
  if(!items.length){
    main.innerHTML = '<div class="empty">データがないよ。「データを取得/更新」を押してね。</div>';
    document.getElementById("count").textContent = "";
    return;
  }
  const cols = getColumns(currentCat);
  const q = document.getElementById("search").value.trim().toLowerCase();
  const typeF = currentCat === "weapons" ? document.getElementById("typeFilter").value : "";

  let filtered = items.filter(it => {
    if(!showBanned && it.Banned) return false;
    if(q && !(it.Name||"").toLowerCase().includes(q)) return false;
    if(typeF && it.WeaponType !== typeF) return false;
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

let calcSelection = { A:{head:null, body:null, legs:null}, B:{head:null, body:null, legs:null} };

function classifySlot(name){
  const n = (name||"").toLowerCase();
  if(/helmet|headgear|mask|hood|hat\b|cap\b|antlers|horn|headpiece|hairpin|wig/.test(n)) return "head";
  if(/breastplate|chainmail|plate mail|scalemail|scale mail|robe|shirt|jerkin|vest|shell|plating|tunic|torso|dress|\bgi\b/.test(n)) return "body";
  if(/leggings|greaves|pants|trousers|\bleg\b/.test(n)) return "legs";
  return "other";
}

function getArmorPool(){
  return Object.values(store.armorPieces).filter(a => showBanned || !a.Banned);
}

function renderCalculator(){
  const main = document.getElementById("main");
  const pool = getArmorPool();
  if(!pool.length){
    main.innerHTML = '<div class="empty">先に「データを取得/更新」で防具データを取得してね。</div>';
    return;
  }
  const slots = [["head","頭(head)"],["body","胴(body)"],["legs","足(leg)"]];
  function setPanel(id){
    const rows = slots.map(([slot,label]) => `
      <div class="calc-row">
        <label>${label}</label>
        <input type="text" list="dl-${id}-${slot}" placeholder="名前で検索..." data-set="${id}" data-slot="${slot}" oninput="onCalcInput(this)">
        <datalist id="dl-${id}-${slot}">
          ${pool.filter(a=>classifySlot(a.Name)===slot).sort((a,b)=>a.Name.localeCompare(b.Name)).map(a=>`<option value="${escapeHtml(a.Name)}">`).join("")}
        </datalist>
      </div>`).join("");
    return `<div class="calc-set"><h3>set${id}</h3>${rows}</div>`;
  }
  main.innerHTML = `
    <div class="calc-wrap">
      ${setPanel("A")}
      ${setPanel("B")}
    </div>
    <div class="calc-result" id="calcResult"></div>
  `;
  updateCalcResult();
}

function onCalcInput(el){
  const setId = el.dataset.set, slot = el.dataset.slot;
  const val = el.value;
  const pool = getArmorPool();
  const match = pool.find(a => a.Name === val && classifySlot(a.Name) === slot);
  calcSelection[setId][slot] = match || null;
  updateCalcResult();
}

function sumStats(sel){
  const pieces = [sel.head, sel.body, sel.legs].filter(Boolean);
  const stats = {Defense:0, Melee:0, Magic:0, Ranged:0, Minion:0};
  pieces.forEach(p=>{
    stats.Defense += p.CurrentDefense || 0;
    stats.Melee += p.CurrentMeleeDamagePercentage || 0;
    stats.Magic += p.CurrentMagicDamagePercentage || 0;
    stats.Ranged += p.CurrentRangedDamagePercentage || 0;
    stats.Minion += p.CurrentMinionDamagePercentage || 0;
  });
  return stats;
}

function updateCalcResult(){
  const box = document.getElementById("calcResult");
  if(!box) return;
  const a = sumStats(calcSelection.A);
  const b = sumStats(calcSelection.B);
  const rows = [
    ["防御力 (Defense)", a.Defense, b.Defense],
    ["近接ダメージ% (Melee)", a.Melee, b.Melee],
    ["魔法ダメージ% (Magic)", a.Magic, b.Magic],
    ["遠隔ダメージ% (Ranged)", a.Ranged, b.Ranged],
    ["ミニオンダメージ% (Minion)", a.Minion, b.Minion]
  ];
  function diffClass(x, y){ if(x === y) return ""; return x > y ? "calc-diff-pos" : "calc-diff-neg"; }
  let html = '<table><thead><tr><th>項目</th><th style="text-align:right;">セットA</th><th style="text-align:right;">セットB</th></tr></thead><tbody>';
  rows.forEach(([label, av, bv]) => {
    html += `<tr><td>${escapeHtml(label)}</td><td class="num ${diffClass(av,bv)}">${escapeHtml(av)}</td><td class="num ${diffClass(bv,av)}">${escapeHtml(bv)}</td></tr>`;
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}

loadAll();
