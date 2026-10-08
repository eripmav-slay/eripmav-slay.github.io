// tinvapi.dark-gaming.com/pvp と通信するだけのクラス
class PvpApiClient {
  async fetchPlayers() {
    // プレイヤー一覧を取得して配列で返す
    const data = await fetchJson(TINV_API_BASE)
    return data.players || []
  }

  async fetchPlayerDetail(name) {
    // 1人分の詳細(items.equipmentに防具+アクセサリーが入っている)を取得して返す
    return await fetchJson(`${TINV_API_BASE}/${encodeURIComponent(name)}`)
  }
}
