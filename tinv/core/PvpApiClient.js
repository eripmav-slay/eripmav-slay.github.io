// tinvapi.dark-gaming.com/pvp と通信するだけのクラス
class PvpApiClient {
  async fetchPlayers() {
    // プレイヤー一覧を取得して配列で返す
    let res
    try {
      res = await fetch(TINV_API_BASE, { mode: "cors" })
    } catch (e) {
      throw new Error(`ネットワークエラー: ${TINV_API_BASE}`)
    }
    if (!res.ok) throw new Error(`HTTPエラー ${res.status}: ${TINV_API_BASE}`)
    const data = await res.json()
    return data.players || []
  }

  async fetchPlayerDetail(name) {
    // 1人分の詳細(items.equipmentに防具+アクセサリーが入っている)を取得して返す
    const url = `${TINV_API_BASE}/${encodeURIComponent(name)}`
    let res
    try {
      res = await fetch(url, { mode: "cors" })
    } catch (e) {
      throw new Error(`ネットワークエラー: ${url}`)
    }
    if (!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`)
    return await res.json()
  }
}
