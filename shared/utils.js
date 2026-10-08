function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function escapeRegex(s) {
  // 正規表現の特殊文字をエスケープした文字列を返す(RegExpの中にそのまま埋め込める形)
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchJson(url) {
  // urlにGETしてレスポンスのJSONをパースして返す(全APIクライアント共通)
  // FETCH_TIMEOUT_MSを超えたら通信を打ち切る(本文の読み込み中も含む)
  // 通信/HTTPエラー/タイムアウト時はErrorをthrowする
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let res;
    try {
      res = await fetch(url, { mode: "cors", signal: controller.signal });
    } catch (e) {
      throw new Error(`${controller.signal.aborted ? "タイムアウト" : "ネットワークエラー"}: ${url}`);
    }
    if (!res.ok) throw new Error(`HTTPエラー ${res.status}: ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
