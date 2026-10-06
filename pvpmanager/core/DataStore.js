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
  }

  async loadAll(onProgress) {
    // 4カテゴリ+settingsを並列取得する
    // onProgress(done, total)を取得完了のたびに呼ぶ
    // 失敗した場合はエラーメッセージの配列を返す
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
    let bannedEquipmentIds = new Set();

    const categoryTasks = categories.map(async (cfg) => {
      try {
        const items = await this.apiClient.fetchCategory(cfg.endpoint, cfg.responseKey);
        const map = {};
        items.forEach(it => { map[it.NetID ?? it._id] = it; });
        this[cfg.storeKey] = map;
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
        bannedEquipmentIds = new Set(settings.BannedEquipment || []);
      } catch (e) {
        errors.push(`settings: ${e.message}`);
      } finally {
        done++;
        onProgress?.(done, total);
      }
    })();

    await Promise.all([...categoryTasks, settingsTask]);

    // settings.BannedEquipmentに載っているIDは武器/防具/アクセサリーどれもBanned扱いにする
    // 武器は自前のBannedフィールドも持っているので、どちらかがtrueならBanned
    Object.values(this.weapons).forEach(w => {
      w.Banned = !!w.Banned || bannedEquipmentIds.has(w.NetID);
    });
    Object.values(this.armorPieces).forEach(a => {
      a.Banned = bannedEquipmentIds.has(a.NetID);
    });

    // アクセサリーは自前のBannedフィールドを持たないのでsettingsのBanアイテムが記録されたリストで判定し、
    // 効果(AccessoryEffectRegistry)をまとめてAccessoryインスタンスにする
    const wrapped = {};
    Object.values(this.accessories).forEach(raw => {
      raw.Banned = bannedEquipmentIds.has(raw.NetID);
      const effects = this.effectRegistry.getEffects(raw.Name);
      wrapped[raw.NetID] = new Accessory(raw, effects);
    });
    this.accessories = wrapped;

    return errors;
  }
}
