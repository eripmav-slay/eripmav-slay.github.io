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
      populateSlotFilter();
    }
    render();
  });
});

function setWidth(px){
  document.getElementById("main").style.maxWidth = px + "px";
}

let bannedFilter = "hide"; // hide/all/only

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

function setStatus(text, spinning = false){
  const el = document.getElementById("status");
  el.innerHTML = "";
  if(spinning){
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    el.appendChild(spinner);
    el.appendChild(document.createTextNode(" "));
  }
  el.appendChild(document.createTextNode(text));
}

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
  setStatus("読み込み中...", true);
  let errors = [];
  for(const catKey of Object.keys(CATS)){
    try{
      setStatus(`読み込み中 (${catKey})...`, true);
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

  populateTypeFilter();
  populateSlotFilter();
  render();

  if(errors.length){
    showFetchError(errors);
  }
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
  const items = Object.values(store[currentCat]);
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

let calcSelection = {
  A:{head:null, body:null, legs:null, accessories:Array(7).fill(null), modifiers:Array(7).fill(""), sake:false},
  B:{head:null, body:null, legs:null, accessories:Array(7).fill(null), modifiers:Array(7).fill(""), sake:false}
};

// armor-slot-head.js の HEAD_KEYWORDS / HEAD_ITEM_NAMES を使って判定用
// 完全一致リストはSetに、単語群は\bで区切ったOR正規表現にまとめる
const HEAD_ITEM_NAMES_LOWER = new Set(HEAD_ITEM_NAMES.map(s => s.toLowerCase()));
const HEAD_KEYWORD_REGEX = new RegExp(
  HEAD_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i"
);

// armor-slot-body.js の BODY_KEYWORDS / BODY_ITEM_NAMES も同じ
const BODY_ITEM_NAMES_LOWER = new Set(BODY_ITEM_NAMES.map(s => s.toLowerCase()));
const BODY_KEYWORD_REGEX = new RegExp(
  BODY_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i"
);

// armor-slot-legs.js の LEGS_KEYWORDS / LEGS_ITEM_NAMES も同じ
const LEGS_ITEM_NAMES_LOWER = new Set(LEGS_ITEM_NAMES.map(s => s.toLowerCase()));
const LEGS_KEYWORD_REGEX = new RegExp(
  LEGS_KEYWORDS.map(w => `\\b${w}\\b`).join("|"), "i"
);

function classifySlot(name){
  const n = (name||"").toLowerCase();
  if(HEAD_ITEM_NAMES_LOWER.has(n) || HEAD_KEYWORD_REGEX.test(n)) return "head";
  if(BODY_ITEM_NAMES_LOWER.has(n) || BODY_KEYWORD_REGEX.test(n)) return "body";
  if(LEGS_ITEM_NAMES_LOWER.has(n) || LEGS_KEYWORD_REGEX.test(n)) return "legs";
  return "other";
}

function getArmorPool(){
  return Object.values(store.armorPieces).filter(a => bannedFilter !== "hide" || !a.Banned);
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
        <input type="text" list="dl-${id}-${slot}" placeholder="名前で検索..." value="${escapeHtml(calcSelection[id][slot]?.Name || '')}" data-set="${id}" data-slot="${slot}" oninput="onCalcInput(this)">
        <datalist id="dl-${id}-${slot}">
          ${pool.filter(a=>classifySlot(a.Name)===slot).sort((a,b)=>a.Name.localeCompare(b.Name)).map(a=>`<option value="${escapeHtml(a.Name)}">`).join("")}
        </datalist>
      </div>`).join("");

    const accRows = Array.from({length:7}).map((_, i) => `
      <div class="calc-row calc-acc-row">
        <input type="text" list="dl-${id}-acc-${i}" placeholder="アクセサリー ${i+1}" value="${escapeHtml(calcSelection[id].accessories[i]?.name || '')}" data-set="${id}" data-accidx="${i}" oninput="onCalcAccessoryInput(this)">
        <datalist id="dl-${id}-acc-${i}">
          ${ACCESSORIES.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(a=>`<option value="${escapeHtml(a.name)}">`).join("")}
        </datalist>
        <select data-set="${id}" data-accidx="${i}" onchange="onCalcModifierChange(this)">
          <option value="" ${calcSelection[id].modifiers[i]===""?"selected":""}>-</option>
          <option value="menacing" ${calcSelection[id].modifiers[i]==="menacing"?"selected":""}>menacing (+4% dmg)</option>
          <option value="warding" ${calcSelection[id].modifiers[i]==="warding"?"selected":""}>warding (+4 def)</option>
        </select>
      </div>`).join("");

    return `<div class="calc-set"><h3>set${id}</h3>${rows}
      <label class="calc-toggle">
        <input type="checkbox" ${calcSelection[id].sake ? "checked" : ""} onchange="onSakeToggle('${id}', this.checked)">
        enable sake (Def -4, Melee +10%)
      </label>
      <h3 class="calc-acc-heading">アクセサリー(最大7)</h3>
      ${accRows}
    </div>`;
  }
  main.innerHTML = `
    <div class="calc-wrap">
      ${setPanel("A")}
      <div class="calc-copy-controls">
        <button onclick="copySet('A','B')" title="セットAの内容をセットBにコピー">A->B</button>
        <button onclick="copySet('B','A')" title="セットBの内容をセットAにコピー">B->A</button>
      </div>
      ${setPanel("B")}
    </div>
    <div class="calc-result" id="calcResult"></div>
  `;
  updateCalcResult();
}

function copySet(fromId, toId){
  const from = calcSelection[fromId];
  calcSelection[toId] = {
    head: from.head, body: from.body, legs: from.legs,
    accessories: from.accessories.slice(),
    modifiers: from.modifiers.slice(),
    sake: from.sake
  };
  renderCalculator();
}

function onCalcInput(el){
  const setId = el.dataset.set, slot = el.dataset.slot;
  const val = el.value;
  const pool = getArmorPool();
  const match = pool.find(a => a.Name === val && classifySlot(a.Name) === slot);
  calcSelection[setId][slot] = match || null;
  updateCalcResult();
}

function onCalcAccessoryInput(el){
  const setId = el.dataset.set, idx = Number(el.dataset.accidx);
  const val = el.value;
  const match = ACCESSORIES.find(a => a.name === val);

  if(match){
    const dupIdx = calcSelection[setId].accessories.findIndex((a,i) => i !== idx && a && a.name === match.name);
    if(dupIdx !== -1){
      alert(`${match.name}\n同時に装備できないよ(cannot equip the same item)`);
      el.value = calcSelection[setId].accessories[idx]?.name || "";
      return;
    }
    if(match.wing){
      const conflictIdx = calcSelection[setId].accessories.findIndex((a,i) => i !== idx && a && a.wing);
      if(conflictIdx !== -1){
        alert(`wingは一種類のみだよ(There is only one type of wing`);
        el.value = calcSelection[setId].accessories[idx]?.name || "";
        return;
      }
    }
  }

  calcSelection[setId].accessories[idx] = match || null;
  updateCalcResult();
}

function onCalcModifierChange(el){
  const setId = el.dataset.set, idx = Number(el.dataset.accidx);
  calcSelection[setId].modifiers[idx] = el.value;
  updateCalcResult();
}

function onSakeToggle(setId, checked){
  calcSelection[setId].sake = checked;
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
  sel.accessories.forEach((acc, i)=>{
    if(!acc) return;
    stats.Defense += acc.defense || 0;
    stats.Melee += acc.melee || 0;
    stats.Magic += acc.magic || 0;
    stats.Ranged += acc.ranged || 0;
    stats.Minion += acc.minion || 0;
    const mod = sel.modifiers[i];
    if(mod === "menacing"){
      stats.Melee += 4; stats.Magic += 4; stats.Ranged += 4; stats.Minion += 4;
    } else if(mod === "warding"){
      stats.Defense += 4;
    }
  });
  if(sel.sake){
    stats.Defense -= 4;
    stats.Melee += 10;
  }
  return stats;
}

// solarのregenはとりあえずハードコード :p
const SOLAR_FLARE_PIECES = new Set(["Solar Flare Helmet", "Solar Flare Breastplate", "Solar Flare Leggings"]);

function sumMisc(sel){
  let regen=0, dr=0, potion=false, dash=false, wing=false;

  [sel.head, sel.body, sel.legs].forEach(piece=>{
    if(piece && SOLAR_FLARE_PIECES.has(piece.Name)) regen += 1;
  });

  sel.accessories.forEach(acc=>{
    if(!acc) return;
    regen += acc.regen || 0;
    dr += acc.dr || 0;
    if(acc.potionCooldown) potion = true;
    if(acc.doubleTapDash) dash = true;
    if(acc.wing) wing = true;
  });
  return {regen, dr, potion, dash, wing};
}

function updateCalcResult(){
  const box = document.getElementById("calcResult");
  if(!box) return;
  const a = sumStats(calcSelection.A);
  const b = sumStats(calcSelection.B);
  const miscA = sumMisc(calcSelection.A);
  const miscB = sumMisc(calcSelection.B);

  const rows = [
    ["防御力 (Defense)", a.Defense, b.Defense],
    ["近接ダメージ% (Melee)", a.Melee, b.Melee],
    ["魔法ダメージ% (Magic)", a.Magic, b.Magic],
    ["遠隔ダメージ% (Ranged)", a.Ranged, b.Ranged],
    ["ミニオンダメージ% (Minion)", a.Minion, b.Minion]
  ].filter(([,av,bv]) => av || bv); // 両方0なら行ごと非表示

  function diffClass(x, y){ if(x === y) return ""; return x > y ? "calc-diff-pos" : "calc-diff-neg"; }

  let html = '<table><thead><tr><th>項目</th><th style="text-align:right;">セットA</th><th style="text-align:right;">セットB</th></tr></thead><tbody>';
  if(!rows.length){
    html += `<tr><td colspan="3" class="calc-misc-empty">まだ何も選ばれていないよ</td></tr>`;
  }
  rows.forEach(([label, av, bv]) => {
    html += `<tr><td>${escapeHtml(label)}</td><td class="num ${diffClass(av,bv)}">${escapeHtml(av)}</td><td class="num ${diffClass(bv,av)}">${escapeHtml(bv)}</td></tr>`;
  });

  // その他(regen/DR/ポーションCT/ダッシュ/飛行)。片方でも値/trueがある行だけ表示する。
  // ラベル/表記は元のファイルにあった英語表記のまま。
  const miscRows = [
    ["Regen", miscA.regen, miscB.regen, v => `+${v}`],
    ["DR", miscA.dr, miscB.dr, v => `+${v}%`],
    ["Life Potion CT", miscA.potion, miscB.potion, () => "cut25%"],
    ["Dash", miscA.dash, miscB.dash, () => "double tap"],
    ["Wing", miscA.wing, miscB.wing, () => "jump to fly"]
  ].filter(([,av,bv]) => av || bv);

  if(miscRows.length){
    html += `<tr class="calc-subhead"><td colspan="3">その他(misc)</td></tr>`;
    miscRows.forEach(([label, av, bv, fmt]) => {
      html += `<tr><td>${escapeHtml(label)}</td><td class="num">${av ? escapeHtml(fmt(av)) : '-'}</td><td class="num">${bv ? escapeHtml(fmt(bv)) : '-'}</td></tr>`;
    });
  }

  html += '</tbody></table>';
  box.innerHTML = html;
}

loadAll();
