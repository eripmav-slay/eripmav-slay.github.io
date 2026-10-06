let calcSelection = {
  A:{head:null, body:null, legs:null, accessories:Array(7).fill(null), modifiers:Array(7).fill(""), sake:false},
  B:{head:null, body:null, legs:null, accessories:Array(7).fill(null), modifiers:Array(7).fill(""), sake:false}
};

function getArmorPool(){
  return Object.values(store.armorPieces).filter(a => bannedFilter !== "hide" || !a.Banned);
}

// APIから取れる実ステータス(store.accessories)と、accessories.jsの追加情報(regen/dr/wingなど)をNameで突き合わせてマージ
function getAccessoryPool(){
  return Object.values(store.accessories).map(a => {
    const extra = ACCESSORIES.find(x => x.name === a.Name);
    return {
      ...a,
      wing: extra?.wing || false,
      regen: extra?.regen || 0,
      dr: extra?.dr || 0,
      potionCooldown: extra?.potionCooldown || false,
      doubleTapDash: extra?.doubleTapDash || false
    };
  });
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

    const accPool = getAccessoryPool();
    const accRows = Array.from({length:7}).map((_, i) => `
      <div class="calc-row calc-acc-row">
        <input type="text" list="dl-${id}-acc-${i}" placeholder="アクセサリー ${i+1}" value="${escapeHtml(calcSelection[id].accessories[i]?.Name || '')}" data-set="${id}" data-accidx="${i}" oninput="onCalcAccessoryInput(this)">
        <datalist id="dl-${id}-acc-${i}">
          ${accPool.slice().sort((a,b)=>a.Name.localeCompare(b.Name)).map(a=>`<option value="${escapeHtml(a.Name)}">`).join("")}
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
        <button onclick="copySet('A','B')" title="セットAの内容をセットBにコピー">A-&gt;B</button>
        <button onclick="copySet('B','A')" title="セットBの内容をセットAにコピー">B-&gt;A</button>
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
  const match = getAccessoryPool().find(a => a.Name === val);

  if(match){
    const dupIdx = calcSelection[setId].accessories.findIndex((a,i) => i !== idx && a && a.Name === match.Name);
    if(dupIdx !== -1){
      alert(`${match.Name}\n同時に装備できないよ(cannot equip the same item)`);
      el.value = calcSelection[setId].accessories[idx]?.Name || "";
      return;
    }
    if(match.wing){
      const conflictIdx = calcSelection[setId].accessories.findIndex((a,i) => i !== idx && a && a.wing);
      if(conflictIdx !== -1){
        alert(`wingは一種類のみだよ(There is only one type of wing)`);
        el.value = calcSelection[setId].accessories[idx]?.Name || "";
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
    stats.Defense += acc.CurrentDefense || 0;
    stats.Melee += acc.CurrentMeleeDamagePercentage || 0;
    stats.Magic += acc.CurrentMagicDamagePercentage || 0;
    stats.Ranged += acc.CurrentRangedDamagePercentage || 0;
    stats.Minion += acc.CurrentMinionDamagePercentage || 0;
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
  ].filter(([,av,bv]) => av || bv);

  function diffClass(x, y){ if(x === y) return ""; return x > y ? "calc-diff-pos" : "calc-diff-neg"; }

  let html = '<table><thead><tr><th>項目</th><th style="text-align:right;">セットA</th><th style="text-align:right;">セットB</th></tr></thead><tbody>';
  if(!rows.length){
    html += `<tr><td colspan="3" class="calc-misc-empty">まだ何も選ばれていないよ</td></tr>`;
  }
  rows.forEach(([label, av, bv]) => {
    html += `<tr><td>${escapeHtml(label)}</td><td class="num ${diffClass(av,bv)}">${escapeHtml(av)}</td><td class="num ${diffClass(bv,av)}">${escapeHtml(bv)}</td></tr>`;
  });

  // その他(regen/DR/ポーションCT/ダッシュ/飛行)
  // 片方でも値/trueがある行だけ表示する
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
