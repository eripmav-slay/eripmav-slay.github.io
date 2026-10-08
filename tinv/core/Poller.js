// 一定間隔でコールバックを実行する汎用クラス
class Poller {
  constructor(callback, intervalMs) {
    this.callback = callback
    this.intervalMs = intervalMs
    this.timerId = null
    this.running = false // callbackの実行中はtrue、通信が間隔より長引いても多重に実行しないため
  }

  start() {
    // 即座に1回実行してから、以後intervalMsごとに実行する
    if (this.timerId !== null) return
    this._run()
    this.timerId = setInterval(() => this._run(), this.intervalMs)
  }

  stop() {
    // タイマーを止める、既に止まっていれば何もしない
    if (this.timerId === null) return
    clearInterval(this.timerId)
    this.timerId = null
  }

  async _run() {
    // 前回のcallbackが終わっていなければ今回は飛ばす
    if (this.running) return
    this.running = true
    try {
      await this.callback()
    } finally {
      this.running = false
    }
  }
}
