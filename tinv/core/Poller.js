// 一定間隔でコールバックを実行する汎用クラス
class Poller {
  constructor(callback, intervalMs) {
    this.callback = callback
    this.intervalMs = intervalMs
    this.timerId = null
  }

  start() {
    // 即座に1回実行してから、以後intervalMsごとに実行する
    if (this.timerId !== null) return
    this.callback()
    this.timerId = setInterval(() => this.callback(), this.intervalMs)
  }

  stop() {
    // タイマーを止める、既に止まっていれば何もしない
    if (this.timerId === null) return
    clearInterval(this.timerId)
    this.timerId = null
  }
}
