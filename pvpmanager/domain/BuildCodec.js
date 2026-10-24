/**
 * 計算機のセットA/Bを、共有用の文字列(URLハッシュに載せるコード)に変換する/戻すクラス
 * DOMとlocationは触らない(URLの組み立て、クリップボード、ハッシュの読み書きはApp側の担当)
 * 形式: v1;A:{頭}.{胴}.{足}.{sake}.{acc0}.…{acc6};B:…
 *   防具/アクセサリーはNetID、sakeは0/1、アクセサリー枠の末尾1文字はmodifier(BUILD_MODIFIER_CODES)
 *   空の枠はNetIDを空にする(modifierだけ入っている枠もある)
 */
class BuildCodec {
  static toHash(code) {
    // コードをURLハッシュ("#calc=コード")にして返す
    return `#${BUILD_HASH_KEY}=${code}`;
  }

  static fromHash(hash) {
    // URLハッシュからコードを取り出して返す 計算機のハッシュでなければnull
    const prefix = `#${BUILD_HASH_KEY}=`;
    if (!hash.startsWith(prefix)) return null;
    const raw = hash.slice(prefix.length);
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  }

  static encode(sets) {
    // { A, B } のArmorSetをコードの文字列にして返す
    const segments = Object.keys(sets).map(setId => `${setId}:${BuildCodec._encodeSet(sets[setId])}`);
    return [BUILD_CODE_VERSION, ...segments].join(";");
  }

  static _encodeSet(set) {
    // 1セット分を "頭.胴.足.sake.acc0…" の文字列にして返す
    const armorId = piece => (piece ? piece.NetID : "");
    const accessories = set.accessories.map((acc, i) =>
      `${acc ? acc.netId : ""}${BUILD_MODIFIER_CODES[set.modifiers[i]] || ""}`);
    return [armorId(set.head), armorId(set.body), armorId(set.legs), set.sakeEnabled ? "1" : "0", ...accessories].join(".");
  }

  static decode(code, dataStore, slotClassifier) {
    // コードをArmorSetのペアに戻して { sets, skipped, error } を返す
    // sets: { A, B }(形式が壊れている/未対応の版ならnull)
    // skipped: 反映できなかった項目の説明の配列(データに無い/Ban済み/部位違い/重複/ウィング競合)
    // error: 形式エラーの説明(問題なければnull)
    // 反映のルールは計算機の入力(onArmorInput/onAccessoryInput)と同じにしてある
    const fail = error => ({ sets: null, skipped: [], error });
    const segments = code.split(";");
    if (segments[0] !== BUILD_CODE_VERSION) return fail(`未対応の版: ${segments[0]}`);

    const modifierChars = Object.values(BUILD_MODIFIER_CODES).join("");
    const modifierByChar = Object.fromEntries(Object.entries(BUILD_MODIFIER_CODES).map(([name, ch]) => [ch, name]));
    const armorPattern = /^-?\d*$/;
    const accessoryPattern = new RegExp(`^(-?\\d+)?([${modifierChars}])?$`);

    const sets = { A: new ArmorSet(), B: new ArmorSet() };
    const skipped = [];
    const armorSlots = ["head", "body", "legs"];

    for (const segment of segments.slice(1)) {
      const match = /^(\w+):(.*)$/.exec(segment);
      if (!match || !sets[match[1]]) return fail(`セットの指定が不正: ${segment}`);
      const setId = match[1];
      const set = sets[setId];
      const fields = match[2].split(".");
      if (fields.length !== 4 + ACCESSORY_SLOT_COUNT) return fail(`セット${setId}の項目数が合わない: ${fields.length}`);

      const accessoryFields = fields.slice(4).map(f => accessoryPattern.exec(f));
      const armorFieldsOk = fields.slice(0, 3).every(f => armorPattern.test(f));
      if (!armorFieldsOk || !/^[01]$/.test(fields[3]) || accessoryFields.some(m => !m)) return fail(`セット${setId}の値が不正`);

      armorSlots.forEach((slot, i) => {
        const netId = fields[i];
        if (netId === "") return;
        const piece = dataStore.armorPieces[netId];
        if (!piece || slotClassifier.classify(piece.Name) !== slot) {
          skipped.push(`セット${setId} ${slot}: NetID ${netId} が見つからない`);
        } else if (piece.Banned) {
          skipped.push(`セット${setId} ${slot}: ${piece.Name} はBan済み`);
        } else {
          set[slot] = piece;
        }
      });

      set.sakeEnabled = fields[3] === "1";

      accessoryFields.forEach((m, i) => {
        set.modifiers[i] = m[2] ? modifierByChar[m[2]] : "";
        if (m[1] === undefined) return;
        const acc = dataStore.accessories[m[1]];
        if (!acc) skipped.push(`セット${setId} acc${i + 1}: NetID ${m[1]} が見つからない`);
        else if (acc.isBanned) skipped.push(`セット${setId} acc${i + 1}: ${acc.name} はBan済み`);
        else if (set.hasDuplicateAccessory(acc.name, i)) skipped.push(`セット${setId} acc${i + 1}: ${acc.name} は重複`);
        else if (acc.hasWing() && set.hasConflictingWing(i)) skipped.push(`セット${setId} acc${i + 1}: ${acc.name} はwingが競合`);
        else set.accessories[i] = acc;
      });
    }

    return { sets, skipped, error: null };
  }
}
