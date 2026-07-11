// The seek bar, ported from the portfolio's SeekBar.tsx: a relative-jog seek
// (drag it, don't tap-to-jump) with a mini frequency spectrum growing from the
// track line — a compact visualiser and scrubber in one.

import type { QupiAudio } from "./audio";

const BARS = 40;

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export class SeekBar {
  el: HTMLElement;
  private audio: QupiAudio;
  private baseHue: number;
  private bar: HTMLElement;
  private fill: HTMLElement;
  private handle: HTMLElement;
  private canvas: HTMLCanvasElement;
  private tEl: HTMLElement;
  private dEl: HTMLElement;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private dragX: number | null = null;

  constructor(audio: QupiAudio, baseHue = 254) {
    this.audio = audio;
    this.baseHue = baseHue;
    this.el = document.createElement("div");
    this.el.className = "seekbar";
    this.el.innerHTML = `
      <div class="bar" aria-label="Seek (drag to scrub)">
        <canvas class="mini" aria-hidden="true"></canvas>
        <div class="track"></div>
        <div class="fill"></div>
        <div class="handle"></div>
      </div>
      <div class="times"><span class="t">0:00</span><span class="d">0:00</span></div>
    `;
    this.bar = this.el.querySelector(".bar")!;
    this.fill = this.el.querySelector(".fill")!;
    this.handle = this.el.querySelector(".handle")!;
    this.canvas = this.el.querySelector(".mini")!;
    this.tEl = this.el.querySelector(".t")!;
    this.dEl = this.el.querySelector(".d")!;

    this.bar.addEventListener("pointerdown", (e) => {
      this.bar.setPointerCapture(e.pointerId);
      this.dragX = e.clientX;
    });
    this.bar.addEventListener("pointermove", (e) => {
      if (this.dragX === null || this.audio.duration <= 0) return;
      const dx = e.clientX - this.dragX;
      this.dragX = e.clientX;
      const w = this.bar.getBoundingClientRect().width || 1;
      this.audio.seekBy((dx / w) * this.audio.duration);
    });
    const up = () => {
      this.dragX = null;
    };
    this.bar.addEventListener("pointerup", up);
    this.bar.addEventListener("pointercancel", up);

    const tick = () => {
      requestAnimationFrame(tick);
      this.frame();
    };
    requestAnimationFrame(tick);
  }

  setVisible(v: boolean): void {
    this.el.classList.toggle("visible", v);
  }

  private frame(): void {
    this.drawSpectrum();
    const { position, duration } = this.audio;
    if (duration <= 0) return;
    const pct = (position / duration) * 100;
    this.fill.style.width = `${pct}%`;
    this.handle.style.left = `${pct}%`;
    this.tEl.textContent = fmt(position);
    this.dEl.textContent = fmt(duration);
  }

  private drawSpectrum(): void {
    const analyser = this.audio.analyser;
    const canvas = this.canvas;
    if (!analyser) return;
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    const g = canvas.getContext("2d");
    if (!g) return;
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);
    if (!this.data || this.data.length !== analyser.frequencyBinCount) {
      this.data = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i];
    const vol = Math.min(1, (sum / this.data.length / 255) * 3);
    const hue = (this.baseHue + vol * 60) % 360;
    const maxBin = Math.min(this.data.length - 1, 460);
    const barW = W / BARS;
    for (let i = 0; i < BARS; i++) {
      const t = i / (BARS - 1); // left = bass, right = treble
      const bin = Math.max(1, Math.round(Math.pow(maxBin, t)));
      let v = 0;
      let cnt = 0;
      for (let b = bin; b <= Math.min(bin + 2, maxBin); b++) {
        v += this.data[b];
        cnt++;
      }
      v = v / cnt / 255;
      if (v < 0.03) continue;
      const h = Math.max(1, v * H);
      g.fillStyle = `hsla(${hue}, 90%, ${40 + v * 35}%, ${0.15 + v * 0.5})`;
      g.fillRect(i * barW + 0.5, H - h, Math.max(1, barW - 1), h);
    }
  }
}
