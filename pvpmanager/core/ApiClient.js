/**
 * pvpcapi.dark-gaming.com との通信だけを担当するクラ
 * URLの組み立てとエラーハンドリング以外のロジックは持たせないこと
 * (データの意味づけはDataStore/domainが行う)
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetchCategory(endpoint, responseKey, limit = API_FETCH_LIMIT) {
    // {baseUrl}{endpoint}/all/0/{limit} からレスポンスのresponseKeyに入っている配列を返す
    // 通信/HTTPエラー時はErrorをthrowする
    const data = await fetchJson(`${this.baseUrl}${endpoint}/all/0/${limit}`);
    return data[responseKey] || [];
  }

  async fetchSettings() {
    // {baseUrl}settings から settings オブジェクトをそのまま返す(BannedEquipment等を含む)
    const data = await fetchJson(`${this.baseUrl}settings`);
    return data.settings || {};
  }
}
