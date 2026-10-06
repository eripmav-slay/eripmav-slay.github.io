const BASE = "https://pvpcapi.dark-gaming.com/api/";
const IMG_BASE = "https://pvpmanager.dark-gaming.com/img/item-";
const FETCH_LIMIT = 10000; // 増えたらもっと大きくするか自動で上限取ろうね:p
const CATS = {
  weapons: { endpoint: "weapons", key: "weapons" },
  armorPieces: { endpoint: "armorPieces", key: "armorPieces" },
  projectiles: { endpoint: "projectiles", key: "projectiles" },
  accessories: { endpoint: "accessories", key: "armorPieces" },
};

let store = { weapons: {}, armorPieces: {}, projectiles: {}, accessories: {} };

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

async function fetchCategory(catKey){
  const cfg = CATS[catKey];
  const url = `${BASE}${cfg.endpoint}/all/0/${FETCH_LIMIT}`;
  let res;
  try{
    res = await fetch(url, {mode:"cors"});
  }catch(e){
    throw new Error(`ネットワークエラー: ${url}`);
  }
  if(!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`);
  const data = await res.json();
  return data[cfg.key] || [];
}

async function loadAll(){
  const btn = document.getElementById("refreshBtn");
  btn.disabled = true;
  setStatus("読み込み中...", true);

  const catKeys = Object.keys(CATS);
  let doneCount = 0;
  const errors = [];

  /// h並列処理
  const tasks = catKeys.map(async (catKey) => {
    try{
      const items = await fetchCategory(catKey);
      const map = {};
      items.forEach(it => { map[it.NetID ?? it._id] = it; });
      store[catKey] = map;
    }catch(e){
      errors.push(`${catKey}: ${e.message}`);
    }finally{
      doneCount++;
      setStatus(`読み込み中 (${doneCount}/${catKeys.length})...`, true);
    }
  });

  await Promise.all(tasks);

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

