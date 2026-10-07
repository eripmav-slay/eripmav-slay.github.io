// メンバータブ(PvP参加中プレイヤー一覧)の描画と自動更新を担当するクラス
// 一覧(HP/MP/hotbar)と装備(防具+アクセサリー)は更新頻度が違うので別々のPollerで回す
class MembersView {
  constructor(apiClient, container, statsIntervalMs, equipmentIntervalMs) {
    this.apiClient = apiClient
    this.container = container
    this.players = []
    this._lastNames = null
    this.consecutiveFailures = 0
    this._fetchingEquipment = new Set() // 装備を取得中のプレイヤー名、同じ人への二重リクエストを避ける
    this.equipmentDown = false // 装備APIが落ちてる間はtrue、1人だけ様子見して負荷を絞る
    this.equipmentConsecutiveFailures = 0 // 全員分が1回まるごと失敗した回数、指定回数でequipmentDownにする
    this.statsPoller = new Poller(() => this.refreshStats(), statsIntervalMs)
    this.equipmentPoller = new Poller(() => this.refreshEquipment(), equipmentIntervalMs)
  }

  start() {
    // 2本のポーリングを開始する、タブを開いた時に呼ぶ
    this.statsPoller.start()
    this.equipmentPoller.start()
  }

  stop() {
    // 2本とも止める、他のタブに切り替えた時に呼ぶ
    this.statsPoller.stop()
    this.equipmentPoller.stop()
  }

  async refreshStats() {
    // 一覧(HP/MP/hotbar)を取得して再描画する
    // 失敗してもここでは何もしない、指定回連続で初めてAPI Deadを表示する
    try {
      const rawList = await this.apiClient.fetchPlayers()
      const previousByName = new Map(this.players.map(p => [p.name, p]))

      this.players = rawList.map(raw => {
        const player = new Player(raw)
        const prev = previousByName.get(player.name)
        if (prev && prev.equipment) player.equipment = prev.equipment
        return player
      })

      this.consecutiveFailures = 0
      this.render()

      // 装備がまだ無い人(新規参加やタブを開いた直後)は次のPollerを待たずにすぐ取りに行く
      // ただし装備APIが落ちてる間は無駄打ちしない、復旧はrefreshEquipment側のprobeに任せる
      if (!this.equipmentDown) {
        const missing = this.players.filter(p => !p.equipment)
        if (missing.length) this._fetchEquipment(missing)
      }
    } catch (e) {
      this.consecutiveFailures++
      if (this.consecutiveFailures >= 3) {
        this.container.innerHTML = '<div class="empty api-dead">API Dead...RIP</div>'
        this._lastNames = null
      }
    }
  }

  async refreshEquipment() {
    // 定期更新、落ちてる間は1人だけ様子見して全員分は取りに行かない
    if (this.equipmentDown) {
      const probe = this.players[0]
      if (!probe) return
      const recovered = await this._fetchEquipment([probe])
      if (!recovered) return

      // 復旧したのでAPI died表記を解除、なるべく早く残り全員も取り直す
      this.equipmentDown = false
      this.equipmentConsecutiveFailures = 0
      this._renderEquipmentCells()
      this._fetchEquipment(this.players.slice(1))
      return
    }

    const succeeded = await this._fetchEquipment(this.players.slice())
    if (succeeded) {
      this.equipmentConsecutiveFailures = 0
      return
    }
    if (!this.players.length) return

    // 全員分がまるごと失敗した回数をカウント、指定回連続で初めてdown扱いにする
    this.equipmentConsecutiveFailures++
    if (this.equipmentConsecutiveFailures >= 4) {
      this.equipmentDown = true
      this._renderEquipmentCells()
    }
  }

  async _fetchEquipment(targets) {
    // 指定したプレイヤーの装備を並列取得する、1人コケても他は続行する
    // 取得中の人は飛ばす、結果は取得中にplayersが作り直されても拾えるよう名前で現在のPlayerに入れる
    // 戻り値は1人でも成功したかどうか(down判定/復旧判定に使う)
    const names = targets.map(p => p.name).filter(name => !this._fetchingEquipment.has(name))
    if (!names.length) return false
    names.forEach(name => this._fetchingEquipment.add(name))

    const results = await Promise.allSettled(
      names.map(name => this.apiClient.fetchPlayerDetail(name))
    )

    let successCount = 0
    results.forEach((result, i) => {
      this._fetchingEquipment.delete(names[i])
      if (result.status !== "fulfilled") return
      successCount++
      const current = this.players.find(p => p.name === names[i])
      if (current) current.setEquipment(result.value)
    })

    this._renderEquipmentCells()
    return successCount > 0
  }

  render() {
    // 現在保持しているプレイヤー一覧をテーブルとして描画する
    // メンバーが変わっていなければ表は作り直さず、HP/MPのテキストとhotbarだけ書き換える
    if (!this.players.length) {
      this.container.innerHTML = '<div class="empty">参加中のプレイヤーがいないよ</div>'
      this._lastNames = null
      return
    }

    const existingTable = this.container.querySelector("table.member-table")
    const namesMatch = existingTable
      && this._lastNames
      && this._lastNames.length === this.players.length
      && this._lastNames.every((n, i) => n === this.players[i].name)

    if (namesMatch) {
      this.players.forEach((player, i) => {
        const row = existingTable.tBodies[0].rows[i]
        row.cells[1].innerHTML = this._renderStat(player.hp, player.maxHp)
        row.cells[2].innerHTML = this._renderStat(player.mp, player.maxMp)
        this._updateHotbarCell(row.cells[5], player)
      })
      return
    }

    this._lastNames = this.players.map(p => p.name)

    let html = '<table class="member-table">'
    html += '<colgroup><col class="col-name"><col class="col-stat"><col class="col-stat">'
    html += '<col class="col-armor"><col class="col-acc"><col class="col-hotbar"></colgroup>'
    html += '<thead><tr>'
    html += '<th>Name</th><th>HP</th><th>MP</th>'
    html += '<th class="eq-group">Armor</th><th class="eq-group">Accessories</th><th class="eq-group">Hotbar</th>'
    html += '</tr></thead><tbody>'

    this.players.forEach((player, i) => {
      html += `<tr class="member-row" data-player="${escapeHtml(player.name)}" onclick="app.onMemberRowClick(${i})">`
      html += `<td class="name">${escapeHtml(player.name)}</td>`
      html += `<td class="num">${this._renderStat(player.hp, player.maxHp)}</td>`
      html += `<td class="num">${this._renderStat(player.mp, player.maxMp)}</td>`
      html += `<td class="eq-group">${this._renderArmorCell(player)}</td>`
      html += `<td class="eq-group">${this._renderAccessoryCell(player)}</td>`
      html += `<td class="eq-group" data-signature="${player.getHotbarItems().map(item => item.netId).join(",")}">${this._renderHotbar(player)}</td>`
      html += '</tr>'
    })

    html += '</tbody></table>'
    this.container.innerHTML = html
  }

  _updateHotbarCell(cell, player) {
    // hotbarの中身が前回と違う時だけセルを差し替える、毎回作り直すと画像がチラつくため
    const items = player.getHotbarItems()
    const signature = items.map(item => item.netId).join(",")
    if (cell.dataset.signature === signature) return
    cell.dataset.signature = signature
    cell.innerHTML = this._renderHotbar(player)
  }

  _renderEquipmentCells() {
    // 装備取得が終わった行だけ、Armor/Accessoriesのセルを差し替える
    this.players.forEach(player => {
      const row = this.container.querySelector(`tr[data-player="${CSS.escape(player.name)}"]`)
      if (!row) return
      row.cells[3].innerHTML = this._renderArmorCell(player)
      row.cells[4].innerHTML = this._renderAccessoryCell(player)
    })
  }

  _renderStat(current, max) {
    // 現在値/区切り/最大値をspanで分けて固定幅にする、桁数が違う行でもズレないように
    return `<span class="member-stat">`
      + `<span class="cur">${current}</span>`
      + `<span class="sep">/</span>`
      + `<span class="max">${max}</span>`
      + `</span>`
  }

  _renderArmorCell(player) {
    // 頭/胴/足のアイコンを横並びで返す、落ちてる間はAPI died、未取得なら"-"
    if (this.equipmentDown) return this._renderEquipmentDown()
    if (!player.equipment) return '<span class="eq-pending">-</span>'
    const items = [player.getHeadItem(), player.getBodyItem(), player.getLegsItem()].filter(Boolean)
    return this._renderIconRow(items)
  }

  _renderAccessoryCell(player) {
    // アクセサリー7枠のアイコンを横並びで返す、落ちてる間はAPI died、未取得なら"-"
    if (this.equipmentDown) return this._renderEquipmentDown()
    if (!player.equipment) return '<span class="eq-pending">-</span>'
    return this._renderIconRow(player.getAccessoryItems())
  }

  _renderEquipmentDown() {
    // 装備APIが連続で落ちてる間の表示
    return '<span class="eq-down">API died</span>'
  }

  _renderHotbar(player) {
    // hotbar内のアイテムアイコンを横5個ずつの格子で返す
    return this._renderIconRow(player.getHotbarItems(), "hotbar-grid")
  }

  _renderIconRow(items, extraClass = "") {
    // アイコンを1つの箱にまとめて返す、間隔はCSSのgapで揃えてセルごとの余白のブレをなくす
    // extraClassにhotbar-gridを渡すと横5個ずつ折り返す格子になる
    return `<div class="icon-row ${extraClass}">` + items.map(item => this._renderItemIcon(item.netId)).join('') + '</div>'
  }

  _renderItemIcon(netId) {
    // 1個分のアイテムアイコン<img>を返す
    const src = `${TINV_ITEM_IMAGE_BASE}${netId}`
    return `<img class="hotbar-icon" src="${escapeHtml(src)}" loading="lazy" onerror="this.style.display='none'">`
  }
}
