/**
 * weapons/armorPieces/projectiles/accessories/settings を取得して保持するクラス。
 * アクセサリーをAccessoryインスタンスに変換する処理はここで一度だけ
 */
class DataStore {
  constructor(apiClient, effectRegistry, buffStore) {
    this.apiClient = apiClient;
    this.effectRegistry = effectRegistry;
    this.buffStore = buffStore;
    this.weapons = {};
    this.armorPieces = {};
    this.projectiles = {};
    this.accessories = {}; // NetID -> Accessoryインスタンス
    this.bannedEquipmentIds = new Set(); // settings.BannedEquipmentのID、settings取得に失敗した時は前回の値を使い続ける
  }

  async loadAll(onProgress) {
    // 4カテゴリ+settingsを並列取得する
    // onProgress(done, total)を取得完了のたびに呼ぶ
    // 失敗した場合はエラーメッセージの配列を返す(失敗したカテゴリは前回のデータをそのまま残す)
    const categories = [
      { storeKey: "weapons",     endpoint: "weapons",     responseKey: "weapons" },
      { storeKey: "armorPieces", endpoint: "armorPieces", responseKey: "armorPieces" },
      { storeKey: "projectiles", endpoint: "projectiles", responseKey: "projectiles" },
      // accessoriesエンドポイントはなぜかレスポンスキーがarmorPieces
      { storeKey: "accessories", endpoint: "accessories", responseKey: "armorPieces" }
    ];
    const total = categories.length + 1; // +1 は settings
    let done = 0;
    const errors = [];
    const fetched = {}; // storeKey -> 今回取得できたデータ(NetID -> 生データ)、失敗したカテゴリは入らない

    const categoryTasks = categories.map(async (cfg) => {
      try {
        const items = await this.apiClient.fetchCategory(cfg.endpoint, cfg.responseKey);
        const map = {};
        items.forEach(it => { map[it.NetID ?? it._id] = it; });
        fetched[cfg.storeKey] = map;
      } catch (e) {
        errors.push(`${cfg.storeKey}: ${e.message}`);
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    const settingsTask = (async () => {
      try {
        const settings = await this.apiClient.fetchSettings();
        this.bannedEquipmentIds = new Set(settings.BannedEquipment || []);
      } catch (e) {
        errors.push(`settings: ${e.message}`);
      } finally {
        done++;
        onProgress?.(done, total);
      }
    })();

    await Promise.all([...categoryTasks, settingsTask]);

    // 取得できたカテゴリだけ差し替える(失敗時に前回のデータを壊さないため)
    if (fetched.weapons) this.weapons = fetched.weapons;
    if (fetched.armorPieces) this.armorPieces = fetched.armorPieces;
    if (fetched.projectiles) this.projectiles = fetched.projectiles;

    // アクセサリーは効果(AccessoryEffectRegistry)をまとめてAccessoryインスタンスにする
    // 生データの状態で取れた時だけ変換する(変換済みのインスタンスを二重に包まないため)
    if (fetched.accessories) {
      const wrapped = {};
      Object.values(fetched.accessories).forEach(raw => {
        wrapped[raw.NetID] = new Accessory(raw, this.effectRegistry.getEffects(raw.Name));
      });
      this.accessories = wrapped;
    }

    // settings.BannedEquipmentに載っているIDは武器/防具/アクセサリーどれもBanned扱いにする
    // 武器は自前のBannedフィールドも持っているので、どちらかがtrueならBanned
    // アクセサリーは自前のBannedフィールドを持たないのでsettingsのリストだけで判定する
    Object.values(this.weapons).forEach(w => {
      w.Banned = !!w.Banned || this.bannedEquipmentIds.has(w.NetID);
    });
    Object.values(this.armorPieces).forEach(a => {
      a.Banned = this.bannedEquipmentIds.has(a.NetID);
    });
    Object.values(this.accessories).forEach(acc => {
      acc.raw.Banned = this.bannedEquipmentIds.has(acc.netId);
    });

    return errors;
  }

  _forEachItem(callback) {
    // 武器/防具/アクセサリーを同じ形で callback(category, netId, name, banned, raw) に渡す
    // categoryはBUFF_CATEGORY_LABELSのキー、rawは一覧APIの生データ
    Object.values(this.weapons).forEach(w => callback("weapons", w.NetID, w.Name, !!w.Banned, w));
    Object.values(this.armorPieces).forEach(a => callback("armorPieces", a.NetID, a.Name, !!a.Banned, a));
    Object.values(this.accessories).forEach(acc => callback("accessories", acc.netId, acc.name, acc.isBanned, acc.raw));
  }

  getBuffInfo(category, netId, raw) {
    // バフ詳細(個別API)を取得済みならそれを、無ければ一覧APIのデータから作ったBuffInfoを返す
    return this.buffStore.get(category, netId) || new BuffInfo(raw);
  }

  async loadBuffDetails(onProgress) {
    // 一覧APIでバフ関連のフィールドを持っているアイテムだけ、バフ詳細(個別API)を取得する
    // (全アイテムを取ると数千リクエストになるため。一覧にフィールドが全く無いアイテムは対象外)
    // 失敗があればエラーメッセージの配列を返す(失敗したアイテムは一覧のデータで表示する)
    const targets = [];
    this._forEachItem((category, netId, name, banned, raw) => {
      if (BuffInfo.hasBuffFields(raw)) targets.push({ category, netId, name });
    });
    const failures = await this.buffStore.load(targets, onProgress);
    if (!failures.length) return [];
    return [`バフ詳細の取得に失敗: ${failures.length}/${targets.length}件 (${failures[0].name}: ${failures[0].message}) 一覧のデータで代用しています`];
  }

  getBuffItems() {
    // バフを1つでも持つ 武器/防具/アクセサリー を、共通の形の配列で返す
    // 要素は { category, netId, name, banned, buffs(BuffInfo) }
    const result = [];
    this._forEachItem((category, netId, name, banned, raw) => {
      const buffs = this.getBuffInfo(category, netId, raw);
      if (buffs.hasAny()) result.push({ category, netId, name, banned, buffs });
    });
    return result;
  }
}
