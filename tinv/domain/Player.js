// 1人分のプレイヤーデータを扱うクラス、APIの生データをそのまま持つ
class Player {
  constructor(raw) {
    this.raw = raw
    this.equipment = null // 個別取得(
  }

  get name() {
    // 表示名を返す
    return this.raw.nickname
  }

  get hp() {
    return this.raw.health
  }

  get maxHp() {
    // 最大HPを返す、キーが無いAPIレスポンスの時は素の最大HPにする
    return this.raw.maxHealthWithBuffs ?? this.raw.maxHealth
  }

  get mp() {
    return this.raw.mana
  }

  get maxMp() {
    // 最大MPを返す、キーが無いAPIレスポンスの時は素の最大MPにする
    return this.raw.maxManaWithBuffs ?? this.raw.maxMana
  }

  get isDead() {
    return !!this.raw.dead
  }

  getHotbarItems() {
    // 空スロット(netId 0)を除いたhotbarの配列を返す
    return (this.raw.hotbar || []).filter(item => item.netId !== 0)
  }

  setEquipment(detailRaw) {
    // /pvp/<名前> のレスポンスからequipmentを切り出して保持する
    // index 0-2が頭/胴/足、3-9がアクセサリー7枠
    const eq = detailRaw.items?.equipment || []
    this.equipment = {
      head: eq[TINV_EQUIPMENT_INDEX.head] || null,
      body: eq[TINV_EQUIPMENT_INDEX.body] || null,
      legs: eq[TINV_EQUIPMENT_INDEX.legs] || null,
      accessories: eq.slice(TINV_EQUIPMENT_INDEX.accessoryStart, TINV_EQUIPMENT_INDEX.accessoryStart + ACCESSORY_SLOT_COUNT)
    }
  }

  getHeadItem() {
    return this.equipment?.head || null
  }

  getBodyItem() {
    return this.equipment?.body || null
  }

  getLegsItem() {
    return this.equipment?.legs || null
  }

  getAccessoryItems() {
    // 空枠(netId 0)を除いたアクセサリーの配列を返す
    return (this.equipment?.accessories || []).filter(item => item.netId !== 0)
  }

  getPlayerPageUrl() {
    // クリック時に別タブで開くプレイヤーページのURLを返す
    return `${TINV_PLAYER_PAGE_BASE}${encodeURIComponent(this.name)}`
  }
}
