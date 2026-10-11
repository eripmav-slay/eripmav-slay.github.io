/**
 * バフの詳細(個別API /buffs/{weapon|armorPiece}/{netId}/{フィールド名})を取得して保持するクラス
 * 一覧APIのバフ情報は欠けていることがあったので、個別APIの結果を優先して使う
 * 1アイテムにつき4フィールド分のリクエストが必要なので、同時取得数を絞って取得する
 */
class BuffStore {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.infos = new Map(); // "category:netId" -> BuffInfo
  }

  _key(category, netId) {
    return `${category}:${netId}`;
  }

  get(category, netId) {
    // 取得済みのBuffInfoを返す(未取得/取得失敗ならnull)
    return this.infos.get(this._key(category, netId)) || null;
  }

  async load(targets, onProgress) {
    // targets: [{ category, netId, name }] のバフ詳細を取得して保持する
    // onProgress(done, total)をアイテム1件の取得が終わるたびに呼ぶ
    // 取得に失敗したアイテムは前回のデータ(無ければ一覧のデータ)のままにして、失敗の配列 [{ name, message }] を返す
    const failures = [];
    let next = 0;
    let done = 0;

    const worker = async () => {
      while (next < targets.length) {
        const target = targets[next++];
        try {
          this.infos.set(this._key(target.category, target.netId), await this._fetchInfo(target));
        } catch (e) {
          failures.push({ name: target.name, message: e.message });
        }
        done++;
        if (onProgress) onProgress(done, targets.length);
      }
    };
    await Promise.all(Array.from({ length: BUFF_FETCH_CONCURRENCY }, worker));
    return failures;
  }

  async _fetchInfo(target) {
    // 1アイテムの全フィールドを取得してBuffInfoにして返す(1つでも失敗したらthrow)
    const apiKind = BUFF_API_KIND[target.category];
    const fields = BUFF_API_FIELDS[apiKind];
    const lists = await Promise.all(fields.map(f => this.apiClient.fetchItemBuffs(apiKind, target.netId, f)));
    const rawLike = {};
    fields.forEach((field, i) => { rawLike[field] = lists[i]; });
    return new BuffInfo(rawLike);
  }
}
