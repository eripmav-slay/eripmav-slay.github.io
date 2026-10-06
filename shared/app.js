/**
 * アプリ全体を束ねるクラス
 * DOM上のonclick/oninputは全部 app.xxx() を呼ぶ形にして、
 * ハンドラの置き場所をここに統一
 */
class App {
  constructor() {
    this.apiClient = new ApiClient(BASE);
    this.effectRegistry = new AccessoryEffectRegistry(ACCESSORY_EFFECT_DATA);
    this.dataStore = new DataStore(this.apiClient, this.effectRegistry);
    this.slotClassifier = new SlotClassifier(
      HEAD_ITEM_NAMES, HEAD_KEYWORDS,
      BODY_ITEM_NAMES, BODY_KEYWORDS,
      LEGS_ITEM_NAMES, LEGS_KEYWORDS
    );

    const mainEl = document.getElementById("main");
    this.tableView = new TableView(this.dataStore, this.slotClassifier, mainEl);
    this.calculatorView = new CalculatorView(this.dataStore, this.slotClassifier, mainEl);

    // memberMainは他のタブに切り替えても中身を消さない専用コンテナ
    // ホットバー画像の再取得/再生成を防ぐため
    const memberMainEl = document.getElementById("memberMain");
    this.pvpApiClient = new PvpApiClient();
    this.memberStatsIntervalMs = 5000;     // HP/MP/hotbarの更新間隔
    this.memberEquipmentIntervalMs = 3000; // 防具/アクセサリーの更新間隔
    this.membersView = new MembersView(
      this.pvpApiClient, memberMainEl,
      this.memberStatsIntervalMs, this.memberEquipmentIntervalMs
    );

    this.currentCat = "weapons";
    this.bannedFilter = "hide"; // "hide" | "only" | "all"

    this._bindStaticEvents();
  }

  _bindStaticEvents() {
    // 最初から存在するDOM要素(タブ)へのイベント登録をまとめる
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.cat, tab));
    });
  }

  switchTab(catKey, tabEl) {
    // タブ切り替え アクティブ状態の更新 ツールバー表示切替
    // フィルタ選択肢の再構築 再描画までまとめて行う
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tabEl.classList.add("active");

    // memberタブから離れるならポーリングを止める
    if (this.currentCat === "member" && catKey !== "member") this.membersView.stop();

    this.currentCat = catKey;

    // mainとmemberMainはDOMを保持したまま表示/非表示だけ切り替える
    document.getElementById("main").style.display = catKey === "member" ? "none" : "block";
    document.getElementById("memberMain").style.display = catKey === "member" ? "block" : "none";

    const hideToolbar = catKey === "calculator" || catKey === "member";
    document.getElementById("toolbar").style.display = hideToolbar ? "none" : "flex";
    if (!hideToolbar) {
      document.getElementById("search").value = "";
      this.tableView.populateTypeFilter(document.getElementById("typeFilter"), catKey);
      this.tableView.populateSlotFilter(document.getElementById("slotFilter"), catKey);
    }

    if (catKey === "member") {
      this.membersView.start();
      return;
    }
    this.render();
  }

  setWidth(px) {
    // スライダーの値に応じてメインエリアとメンバーエリアの最大幅を変える
    document.getElementById("main").style.maxWidth = px + "px";
    document.getElementById("memberMain").style.maxWidth = px + "px";
  }

  toggleBannedFilter() {
    // Banフィルタを hide -> only -> all -> hide の順で切り替え
    // チップの表記も更新
    this.bannedFilter = this.bannedFilter === "hide" ? "only" : this.bannedFilter === "only" ? "all" : "hide";
    const chip = document.getElementById("bannedChip");
    chip.classList.toggle("on", this.bannedFilter !== "hide");
    chip.classList.toggle("only", this.bannedFilter === "only");
    chip.textContent =
      this.bannedFilter === "hide" ? "Banned Only" :
      this.bannedFilter === "only" ? "Show All" : "Hide Banned";
    this.render();
  }

  onTableSort(catKey, sortKey) {
    // 一覧タブの列ソート状態を切り替え
    this.tableView.sortBy(catKey, sortKey);
    this.render();
  }

  onCalcArmorInput(el) {
    // 計算機の頭/胴/足入力を受けてCalculatorViewに反映する
    // 拒否された場合は入力欄の表示を元に戻す
    const setId = el.dataset.set, slot = el.dataset.slot;
    const ok = this.calculatorView.onArmorInput(setId, slot, el.value, this.bannedFilter);
    if (!ok) {
      const current = this.calculatorView.sets[setId][slot];
      el.value = current?.Name || "";
    }
  }

  onCalcAccessoryInput(el) {
    // 計算機のアクセサリー入力を受けてCalculatorViewに反映
    const setId = el.dataset.set, idx = Number(el.dataset.accidx);
    const ok = this.calculatorView.onAccessoryInput(setId, idx, el.value, this.bannedFilter);
    if (!ok) {
      const current = this.calculatorView.sets[setId].accessories[idx];
      el.value = current?.name || "";
    }
  }

  onCalcModifierChange(el) {
    // menacing/warding選択の変更をCalculatorViewに反映
    this.calculatorView.onModifierChange(el.dataset.set, Number(el.dataset.accidx), el.value);
  }

  onSakeToggle(setId, checked) {
    // sakeトグルの変更をCalculatorViewに反映
    this.calculatorView.onSakeToggle(setId, checked);
  }

  copyCalcSet(fromId, toId) {
    // セットA/BのコピーをCalculatorViewに反映、計算機タブを再描画
    this.calculatorView.copySet(fromId, toId, this.bannedFilter);
  }

  render() {
    // タブに応じてTableView/CalculatorView/MembersViewのどれかを描画
    // memberタブはPoller側が自前でrefresh/renderするのでここでは何もしない
    if (this.currentCat === "member") return;
    if (this.currentCat === "calculator") {
      this.calculatorView.render(this.bannedFilter);
      return;
    }
    this.tableView.render(this.currentCat, {
      search: document.getElementById("search").value,
      typeFilter: document.getElementById("typeFilter").value,
      slotFilter: document.getElementById("slotFilter").value,
      bannedFilter: this.bannedFilter,
      countEl: document.getElementById("count")
    });
  }

  onMemberRowClick(index) {
    // クリックされたプレイヤーのページを別タブで開く
    const player = this.membersView.players[index];
    if (!player) return;
    window.open(player.getPlayerPageUrl(), "_blank");
  }

  async loadAll() {
    // 全データ(weapons/armorPieces/accessories/projectiles/settings)を取得してUIを更新
    const btn = document.getElementById("refreshBtn");
    btn.disabled = true;
    this._setStatus("読み込み中...", true);

    const errors = await this.dataStore.loadAll((done, total) => {
      this._setStatus(`読み込み中 (${done}/${total})...`, true);
    });

    btn.disabled = false;
    this._setStatus("");

    if (this.currentCat !== "calculator") {
      this.tableView.populateTypeFilter(document.getElementById("typeFilter"), this.currentCat);
      this.tableView.populateSlotFilter(document.getElementById("slotFilter"), this.currentCat);
    }
    this.render();

    if (errors.length) this._showFetchError(errors);
  }

  _setStatus(text, spinning = false) {
    // ヘッダーのステータス表示を更新
    // spinning=trueなら左にスピナーも
    const el = document.getElementById("status");
    el.innerHTML = "";
    if (spinning) {
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      el.appendChild(spinner);
      el.appendChild(document.createTextNode(" "));
    }
    el.appendChild(document.createTextNode(text));
  }

  _showFetchError(errors) {
    // 取得に失敗したカテゴリがあった場合はmainの先頭にエラーパネルを挿入
    const main = document.getElementById("main");
    const div = document.createElement("div");
    div.className = "panel-msg";
    div.innerHTML = `直接取得に失敗した項目があるよ<br>${errors.map(e => `・${escapeHtml(e)}`).join("<br>")}`;
    main.prepend(div);
  }
}

const app = new App();
app.loadAll();
