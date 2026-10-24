/**
 * アプリ全体を束ねるクラス
 * DOM上のonclick/oninputは全部 app.xxx() を呼ぶ形にして、
 * ハンドラの置き場所をここに統一
 */
class App {
  constructor() {
    this.apiClient = new ApiClient(BASE);
    this.effectRegistry = new AccessoryEffectRegistry(ACCESSORY_EFFECT_DATA);
    this.buffStore = new BuffStore(this.apiClient);
    this.dataStore = new DataStore(this.apiClient, this.effectRegistry, this.buffStore);
    this.buffRegistry = new BuffRegistry(BUFF_NAMES);
    this.slotClassifier = new SlotClassifier(
      HEAD_ITEM_NAMES, HEAD_KEYWORDS,
      BODY_ITEM_NAMES, BODY_KEYWORDS,
      LEGS_ITEM_NAMES, LEGS_KEYWORDS
    );

    const mainEl = document.getElementById("main");
    this.tableView = new TableView(this.dataStore, this.slotClassifier, mainEl, this.buffRegistry);
    this.setBonusRegistry = new SetBonusRegistry(SET_BONUS_DATA);
    this.calculatorView = new CalculatorView(
      this.dataStore, this.slotClassifier, mainEl, this.buffRegistry, this.setBonusRegistry
    );

    // memberMainは他のタブに切り替えても中身を消さない
    // ホットバー画像の再取得/再生成を防ぐため
    const memberMainEl = document.getElementById("memberMain");
    this.pvpApiClient = new PvpApiClient();
    this.membersView = new MembersView(
      this.pvpApiClient, memberMainEl,
      MEMBER_STATS_INTERVAL_MS, MEMBER_EQUIPMENT_INTERVAL_MS
    );

    this.currentCat = "weapons";
    this.bannedFilter = "hide"; // "hide" | "only" | "all"
    this.pendingBuildCode = BuildCodec.fromHash(location.hash); // 共有URLで開かれた時のコード、データ取得後に計算機へ反映する

    this._bindStaticEvents();
  }

  _bindStaticEvents() {
    // イベント登録をまとめる(CSPでインラインのonclick等を使わないため、全てここに集約)
    // 最初から存在する要素には直接、後から描画される要素にはmain/memberMainへの委譲で登録する
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.cat, tab));
    });
    document.getElementById("refreshBtn").addEventListener("click", () => this.loadAll());
    document.getElementById("widthSlider").addEventListener("input", e => this.setWidth(e.target.value));
    document.getElementById("search").addEventListener("input", () => this.render());
    document.getElementById("typeFilter").addEventListener("change", () => this.render());
    document.getElementById("slotFilter").addEventListener("change", () => this.render());
    document.getElementById("bannedChip").addEventListener("click", () => this.toggleBannedFilter());

    const mainEl = document.getElementById("main");
    mainEl.addEventListener("click", e => this._onMainClick(e));
    mainEl.addEventListener("input", e => this._onMainInput(e));
    mainEl.addEventListener("change", e => this._onMainChange(e));
    document.getElementById("memberMain").addEventListener("click", e => this._onMemberClick(e));
    window.addEventListener("hashchange", () => this._onHashChange());

    this._syncTopbarHeight();

    document.addEventListener("error", e => {
      if (e.target instanceof HTMLImageElement) e.target.style.display = "none";
    }, true);
  }

  _syncTopbarHeight() {
    // ヘッダーの折り返しやツールバーの表示切替で高さが変わるのでResizeObserverで追従する
    const topbar = document.querySelector(".topbar");
    const update = () => document.documentElement.style.setProperty("--topbar-height", `${topbar.offsetHeight}px`);
    new ResizeObserver(update).observe(topbar);
    update();
  }

  _onMainClick(e) {
    // main内の動的要素(列ヘッダー/計算機のA-Bコピーボタン)のクリックをdata-actionで振り分ける
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "sort") this.onTableSort(el.dataset.cat, el.dataset.sortKey);
    if (el.dataset.action === "copy-set") this.copyCalcSet(el.dataset.from, el.dataset.to);
    if (el.dataset.action === "share-build") this.shareBuild();
    if (el.dataset.action === "set-preset") this.onSetPresetClick(el.dataset.set, Number(el.dataset.index));
  }

  _onMainInput(e) {
    // main内の計算機の入力欄(防具/アクセサリー)のinputをdata-actionで振り分ける
    const el = e.target;
    if (el.dataset.action === "calc-armor") this.onCalcArmorInput(el);
    if (el.dataset.action === "calc-accessory") this.onCalcAccessoryInput(el);
  }

  _onMainChange(e) {
    // main内の計算機の選択(modifier/sake)のchangeをdata-actionで振り分ける
    const el = e.target;
    if (el.dataset.action === "calc-modifier") this.onCalcModifierChange(el);
    if (el.dataset.action === "calc-sake") this.onSakeToggle(el.dataset.set, el.checked);
  }

  _onMemberClick(e) {
    // メンバー一覧の行クリックを、行のdata-index(playersの添字)で振り分ける
    const row = e.target.closest("tr.member-row");
    if (!row) return;
    this.onMemberRowClick(Number(row.dataset.index));
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
    const ok = this.calculatorView.onArmorInput(setId, slot, el.value);
    if (!ok) {
      const current = this.calculatorView.sets[setId][slot];
      el.value = current?.Name || "";
    }
  }

  onCalcAccessoryInput(el) {
    // 計算機のアクセサリー入力を受けてCalculatorViewに反映
    const setId = el.dataset.set, idx = Number(el.dataset.accidx);
    const ok = this.calculatorView.onAccessoryInput(setId, idx, el.value);
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

  onSetPresetClick(setId, index) {
    // セットを装備ボタンの押下をCalculatorViewに反映
    this.calculatorView.onSetPresetClick(setId, index);
  }

  copyCalcSet(fromId, toId) {
    // セットA/BのコピーをCalculatorViewに反映、計算機タブを再描画
    this.calculatorView.copySet(fromId, toId);
  }

  async shareBuild() {
    // 今のセットA/BのURLをクリップボードにコピーしてステータス欄に知らせる
    // クリップボードが使えない場合はpromptに出して手動コピーしてもらう
    const url = location.href.split("#")[0] + BuildCodec.toHash(this.calculatorView.getBuildCode());
    try {
      await navigator.clipboard.writeText(url);
      this._flashStatus("ビルドURLをコピーしたよ");
    } catch (e) {
      window.prompt("コピーできなかったので手動でコピーしてね (copy it manually)", url);
    }
  }

  _onHashChange() {
    // 同じタブで共有URLのハッシュに変わった時に、コードを取り出して反映する
    const code = BuildCodec.fromHash(location.hash);
    if (!code) return;
    this.pendingBuildCode = code;
    this._applyPendingBuild();
  }

  _applyPendingBuild() {
    // 共有コードが待機中で防具データが取れていれば、計算機に読み込んで計算機タブに切り替える
    // 防具データがまだ無ければ何もしない(コードは待機させたまま、次のloadAllで再挑戦する)
    // 読み込めなかった項目があれば内容をalertで知らせる
    if (!this.pendingBuildCode || !Object.keys(this.dataStore.armorPieces).length) return;
    const code = this.pendingBuildCode;
    this.pendingBuildCode = null;
    history.replaceState(null, "", location.pathname + location.search); // 編集後のリロードで古いビルドに戻らないようハッシュを消す

    const result = this.calculatorView.loadBuild(code);
    this.switchTab("calculator", document.querySelector('.tab[data-cat="calculator"]'));
    if (result.error) {
      alert(`ビルドURLを読み込めなかったよ\n(invalid build URL)\n${result.error}`);
    } else if (result.skipped.length) {
      alert(`読み込めなかった項目があるよ\n(some items could not be loaded)\n${result.skipped.map(s => `・${s}`).join("\n")}`);
    }
  }

  render() {
    // タブに応じてTableView/CalculatorView/MembersViewのどれかを描画
    // memberタブはPoller側が自前でrefresh/renderするのでここでは何もしない
    if (this.currentCat === "member") return;
    if (this.currentCat === "calculator") {
      this.calculatorView.render();
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

    // メンバータブのデータも一緒に更新する(通信の失敗はMembersView側で数えるので、ここでは待つだけ)
    const memberTask = this.membersView.refreshAll();

    const errors = await this.dataStore.loadAll((done, total) => {
      this._setStatus(`読み込み中 (${done}/${total})...`, true);
    });

    // 一覧のデータでいったん描画してから、バフ詳細(個別API)を取得して描き直す
    if (this.currentCat !== "calculator") {
      this.tableView.populateTypeFilter(document.getElementById("typeFilter"), this.currentCat);
      this.tableView.populateSlotFilter(document.getElementById("slotFilter"), this.currentCat);
    }
    this.render();

    this._warnMissingSetNames();
    this._warnSlotClassification();
    this._applyPendingBuild();

    const buffErrors = await this.dataStore.loadBuffDetails((done, total) => {
      this._setStatus(`バフ取得中 (${done}/${total})...`, true);
    });

    await memberTask;

    btn.disabled = false;
    this._setStatus("");
    this.render();

    const allErrors = errors.concat(buffErrors);
    if (allErrors.length) this._showFetchError(allErrors);
  }

  _warnMissingSetNames() {
    // setBonuses.jsにあるのに防具データに無い名前をコンソールに警告 typo検出用
    const known = new Set(Object.values(this.dataStore.armorPieces).map(a => a.Name));
    if (!known.size) return;
    const missing = this.setBonusRegistry.findMissingNames(known);
    if (missing.length) console.warn("setBonuses.js: 防具データに無い名前", missing);
  }

  _flashStatus(text) {
    // ステータス欄に一時メッセージを出して、STATUS_FLASH_MS後に消す(その間に別の表示へ変わっていたら消さない)
    this._setStatus(text);
    const el = document.getElementById("status");
    setTimeout(() => { if (el.textContent === text) this._setStatus(""); }, STATUS_FLASH_MS);
  }

  _warnSlotClassification() {
    // 防具の部位判定が怪しい名前をコンソールに警告 実データでの誤分類の確認用
    // 複数の部位に当たる名前(先に当たった部位に分類される)と、どこにも当たらない名前を出す
    const names = Object.values(this.dataStore.armorPieces).map(a => a.Name);
    if (!names.length) return;
    const { ambiguous, unclassified } = this.slotClassifier.findIssues(names);
    if (ambiguous.length) console.warn(`SlotClassifier: 複数の部位に当たる名前 ${ambiguous.length}件 (先に当たった部位に分類されている)`, ambiguous);
    if (unclassified.length) console.warn(`SlotClassifier: 部位が判定できない名前 ${unclassified.length}件`, unclassified);
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
