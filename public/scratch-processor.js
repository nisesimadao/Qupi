// A variable-speed turntable playback head with a *warm*, non-digital scratch.
//
// The cheap/aliased sound of a naive scratch comes from linear interpolation and
// from the highs folding back (aliasing) when the platter is spun faster than 1×.
// Two fixes, both standard for high-quality resampling:
//   * 4-point cubic (Hermite / Catmull-Rom) interpolation instead of linear, and
//   * a one-pole low-pass whose cutoff drops as |speed| rises above 1, so the
//     content that would alias is rolled off instead — the way a real needle has
//     no energy above its bandwidth.
//
// speed = 1 normal, negative = reverse. { seekBy: sec } scrubs; { pos: sec } is
// posted back for the UI. gain = min(1,|speed|) fades the stalled needle.
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
    this.lp = [0, 0]; // one-pole low-pass state per output channel
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

  // 4-point, 3rd-order Hermite interpolation (Laurent de Soras' form).
  static hermite(ym1, y0, y1, y2, f) {
    const c0 = y0;
    const c1 = 0.5 * (y1 - ym1);
    const c2 = ym1 - 2.5 * y0 + 2 * y1 - 0.5 * y2;
    const c3 = 0.5 * (y2 - ym1) + 1.5 * (y0 - y1);
    return ((c3 * f + c2) * f + c1) * f + c0;
  }

  process(_inputs, outputs, parameters) {
    const out = outputs[0];
    if (!this.channels || !out.length) return true;

    const speed = parameters.speed;
    const step = this.srcRate / sampleRate;
    const len = this.channels[0].length;

    for (let i = 0; i < out[0].length; i++) {
      const s = speed.length > 1 ? speed[i] : speed[0];
      this.pos = (((this.pos + s * step) % len) + len) % len;

      const i0 = this.pos | 0;
      const im1 = (i0 - 1 + len) % len;
      const i1 = (i0 + 1) % len;
      const i2 = (i0 + 2) % len;
      const f = this.pos - i0;

      const g = Math.min(1, Math.abs(s));
      // Anti-alias: above 1× the source is under-sampled, so roll off the top.
      // a = 1 (open) at 1× and below, ~1/|speed| above it, clamped so it never
      // closes completely.
      const a = Math.max(0.06, Math.min(1, 1 / Math.max(1, Math.abs(s))));

      for (let c = 0; c < out.length; c++) {
        const ch = this.channels[c < this.channels.length ? c : 0];
        const v = ScratchPlayer.hermite(ch[im1], ch[i0], ch[i1], ch[i2], f);
        this.lp[c] += a * (v - this.lp[c]);
        out[c][i] = this.lp[c] * g;
      }
    }

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
