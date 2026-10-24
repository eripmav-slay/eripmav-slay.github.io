// index.htmlにはこのファイルだけを読み込ませる。他の全スクリプトはここから読み込む
// async=falseで動的に追加したscriptは、ダウンロードは並列で、実行は追加した順(=下の配列の順)になる
// クラス定義が他のクラス/定数を参照している箇所があるため、依存関係順に並べること
const SCRIPT_LOAD_ORDER = [
  "shared/utils.js",
  "shared/constants.js",

  "pvpmanager/core/constants.js",
  "pvpmanager/data/accessoryEffects.js",
  "pvpmanager/data/armorEffects.js",
  "pvpmanager/data/armorSlotKeywords.js",
  "pvpmanager/data/buffData.js",
  "pvpmanager/data/setBonuses.js",
  "pvpmanager/domain/AccessoryEffectRegistry.js",
  "pvpmanager/domain/Accessory.js",
  "pvpmanager/domain/BuffInfo.js",
  "pvpmanager/domain/BuffRegistry.js",
  "pvpmanager/domain/ArmorSet.js",
  "pvpmanager/domain/SlotClassifier.js",
  "pvpmanager/domain/SetBonusRegistry.js",
  "pvpmanager/domain/BuildCodec.js",
  "pvpmanager/core/ApiClient.js",
  "pvpmanager/core/BuffStore.js",
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
  // async=falseにしてあるので、追加した順に実行される
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`読み込み失敗: ${src}`));
    document.body.appendChild(script);
  });
}

async function loadScriptsInOrder(srcList) {
  // srcListの全scriptを一斉に追加する(ダウンロードは並列、実行はsrcListの順)
  // 全部の読み込みが終わるまで待つ、1本でも失敗したらrejectする
  await Promise.all(srcList.map(loadScript));
}

loadScriptsInOrder(SCRIPT_LOAD_ORDER).catch(e => {
  // 途中で読み込み失敗したら、原因が分かるようにコンソールと画面両方に出しておく
  console.error(e);
  const main = document.getElementById("main");
  if (main) main.innerHTML = `<div class="empty">${e.message}</div>`;
});
