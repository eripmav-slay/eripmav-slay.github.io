const scripts = [
    // shared
    "shared/utils.js",
    "shared/constants.js",

    // pvpmanager
    "pvpmanager/core/constants.js",
    "pvpmanager/data/accessoryEffects.js",
    "pvpmanager/data/armorEffects.js",
    "pvpmanager/data/armorSlotKeywords.js",
    "pvpmanager/domain/AccessoryEffectRegistry.js",
    "pvpmanager/domain/Accessory.js",
    "pvpmanager/domain/ArmorSet.js",
    "pvpmanager/domain/SlotClassifier.js",
    "pvpmanager/core/ApiClient.js",
    "pvpmanager/core/DataStore.js",
    "pvpmanager/ui/TableView.js",
    "pvpmanager/ui/CalculatorView.js",

    // tinv
    "tinv/core/constants.js",
    "tinv/core/PvpApiClient.js",
    "tinv/core/Poller.js",
    "tinv/domain/Player.js",
    "tinv/ui/MembersView.js",

    // 最後
    "shared/app.js"
];

function loadScripts() {
// すべての読み込みが完了したことを表すPromiseを返す
    const promises = scripts.map(src => {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src = src;
            script.async = false;

            script.onload = () => resolve(src);

            script.onerror = () => {
                reject(new Error(`Failed to load: ${src}`));
            };

            document.head.appendChild(script);
        });
    });

    return Promise.all(promises);
}

loadScripts()
// loadScripts()の完了を待ち、すべて成功したら実行
    .then(() => {
        console.log("All scripts loaded.");
    })
    .catch(error => {
        console.error(error);

        document.body.insertAdjacentHTML(
            "afterbegin",
            `<div class="script-load-error">
                JavaScriptの読み込みに失敗しました。<br>
                ${error.message}
            </div>`
        );
    });
