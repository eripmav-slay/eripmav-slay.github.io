/**
 * pvpcapi.dark-gaming.com との通信だけを担当するクラ
 * URLの組み立てとエラーハンドリング以外のロジックは持たせないこと
 * (データの意味づけはDataStore/domainが行う)
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetchCategory(endpoint, responseKey, limit = 10000) {
    // {baseUrl}{endpoint}/all/0/{limit} からレスポンスのresponseKeyに入っている配列を返す
    // 通信/HTTPエラー時はErrorをthrowする
    const url = `${this.baseUrl}${endpoint}/all/0/${limit}`;
    let res;
    try {
      res = await fetch(url, { mode: "cors" });
    } catch (e) {
      throw new Error(`ネットワークエラー: ${url}`);
    }
    if (!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`);
    const data = await res.json();
    return data[responseKey] || [];
  }

  async fetchSettings() {
    // {baseUrl}settings から settings オブジェクトをそのまま返す(BannedEquipment等を含む)
    const url = `${this.baseUrl}settings`;
    let res;
    try {
      res = await fetch(url, { mode: "cors" });
    } catch (e) {
      throw new Error(`ネットワークエラー: ${url}`);
    }
    if (!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`);
    const data = await res.json();
    return data.settings || {};
  }
}
