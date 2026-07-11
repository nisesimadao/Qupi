// ターンテーブル風の可変速再生プロセッサ。
// speed パラメータ（1 = 通常再生、負 = 逆再生）に従って再生ヘッドを動かし、
// 線形補間でサンプルを読む。バッファ末尾はループする。
// { seekBy: 秒 } メッセージで相対シーク、再生位置は定期的に { pos: 秒 } で通知する。
class ScratchPlayer extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: "speed", defaultValue: 0, automationRate: "a-rate" }];
  }

  constructor() {
    super();
    this.channels = null;
    this.srcRate = 44100;
    this.pos = 0;
    this.blockCount = 0;
    this.lastPostedPos = -1;
    this.port.onmessage = (e) => {
      if (e.data.channels) {
        this.channels = e.data.channels;
        this.srcRate = e.data.sampleRate;
      } else if (typeof e.data.seekBy === "number" && this.channels) {
        const len = this.channels[0].length;
        this.pos = (((this.pos + e.data.seekBy * this.srcRate) % len) + len) % len;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const out = outputs[0];
    if (!this.channels || !out.length) return true;

    const speed = parameters.speed;
    const step = this.srcRate / sampleRate;
    const len = this.channels[0].length;

    for (let i = 0; i < out[0].length; i++) {
      const s = speed.length > 1 ? speed[i] : speed[0];
      this.pos = (((this.pos + s * step) % len) + len) % len;
      const i0 = this.pos | 0;
      const i1 = (i0 + 1) % len;
      const f = this.pos - i0;
      // 針の速度に応じて音量を落とす: 停止時のDCノイズ防止 & 減速時の自然なフェード
      const g = Math.min(1, Math.abs(s));
      for (let c = 0; c < out.length; c++) {
        const ch = this.channels[c < this.channels.length ? c : 0];
        out[c][i] = (ch[i0] + (ch[i1] - ch[i0]) * f) * g;
      }
    }

    // 再生位置をメインスレッドへ通知（約23回/秒）
    if (++this.blockCount >= 16) {
      this.blockCount = 0;
      if (this.pos !== this.lastPostedPos) {
        this.lastPostedPos = this.pos;
        this.port.postMessage({ pos: this.pos / this.srcRate });
      }
    }
    return true;
  }
}

registerProcessor("scratch-player", ScratchPlayer);
