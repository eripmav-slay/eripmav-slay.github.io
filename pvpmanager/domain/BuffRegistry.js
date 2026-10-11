/**
 * バフIDから表示名を引いたり、持続時間/表示用HTMLを組み立てるクラス
 * 名前の表(BUFF_NAMES)はコンストラクタで受け取る
 */
class BuffRegistry {
  constructor(names) {
    this.names = names;
  }

  getName(id) {
    // 表示名を返す(表に無いIDは "Buff #ID")
    return this.names[id] || `Buff #${id}`;
  }

  formatDuration(ms) {
    // ミリ秒を "4s" "0.5s" のような秒表記の文字列で返す
    return `${Number((ms / MS_PER_SECOND).toFixed(BUFF_DURATION_DECIMALS))}s`;
  }

  renderLabel(id) {
    // バフのアイコン+名前の表示HTMLを返す(アイコンが読み込めないIDは名前だけになる)
    return `<img class="buff-icon" src="${escapeHtml(BUFF_IMG_BASE)}${escapeHtml(id)}.png" alt="" loading="lazy"><span class="buff-name">${escapeHtml(this.getName(id))}</span>`;
  }

  renderLine(entry, showDuration) {
    // バフ1件分(アイコン+名前+持続時間)の表示HTMLを返す、ツールチップにバフIDを入れる
    const duration = showDuration
      ? `<span class="buff-dur">${escapeHtml(this.formatDuration(entry.ms))}</span>`
      : "";
    return `<div class="buff-line" title="Buff ID ${escapeHtml(entry.id)}">${this.renderLabel(entry.id)}${duration}</div>`;
  }
}
