// index.htmlにはこのファイルだけを読み込ませる。他の全スクリプトはここから依存関係順に読み込む
// クラス定義が他のクラスを参照している箇所があるため、1つ読み込み終わるまで次を読み込まない
const SCRIPT_LOAD_ORDER = [
  "shared/utils.js",

  "pvpmanager/core/constants.js",
  "pvpmanager/data/accessoryEffects.js",
  "pvpmanager/data/armorSlotKeywords.js",
  "pvpmanager/domain/AccessoryEffectRegistry.js",
  "pvpmanager/domain/Accessory.js",
  "pvpmanager/domain/ArmorSet.js",
  "pvpmanager/domain/SlotClassifier.js",
  "pvpmanager/core/ApiClient.js",
  "pvpmanager/core/DataStore.js",
  "pvpmanager/ui/TableView.js",
  "pvpmanager/ui/CalculatorView.js",

  "tinv/core/constants.js",
  "tinv/core/PvpApiClient.js",
  "tinv/core/Poller.js",
  "tinv/domain/Player.js",
  "tinv/ui/MembersView.js",

  "shared/app.js" // class App定義+起動処理(new App(); app.loadAll();)が入っているので必ず最後
];

function loadScript(src) {
  // 1本のscriptタグを生成してbodyに追加し、読み込み完了/失敗をPromiseで返す
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`読み込み失敗: ${src}`));
    document.body.appendChild(script);
  });
}

async function loadScriptsInOrder(srcList) {
  // srcListの順番通りに1本ずつ読み込む(前のファイルが終わるまで次を読み込まない)
  for (const src of srcList) {
    await loadScript(src);
  }
}

loadScriptsInOrder(SCRIPT_LOAD_ORDER).catch(e => {
  // 途中で読み込み失敗したら、原因が分かるようにコンソールと画面両方に出しておく
  console.error(e);
  const main = document.getElementById("main");
  if (main) main.innerHTML = `<div class="empty">${e.message}</div>`;
});
