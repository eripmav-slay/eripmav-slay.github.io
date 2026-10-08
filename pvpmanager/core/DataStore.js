/**
 * weapons/armorPieces/projectiles/accessories/settings を取得して保持するクラス。
 * アクセサリーをAccessoryインスタンスに変換する処理はここで一度だけ
 */
class DataStore {
  constructor(apiClient, effectRegistry) {
    this.apiClient = apiClient;
    this.effectRegistry = effectRegistry;
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
}
