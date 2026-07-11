// Edge spectrum, ported from the portfolio's EdgeSpectrum.tsx: two thin canvases
// down the left and right screen edges, driven by the real FFT of the output.
// Highs climb the top, bass sits at the bottom; hue and brightness ride the
// overall loudness. This is a true analyser, not the native version's motion
// pseudo-spectrum.

const BAND_COUNT = 56;
const CANVAS_W = 16;

export class EdgeSpectrum {
  private left: HTMLCanvasElement;
  private right: HTMLCanvasElement;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private getAnalyser: () => AnalyserNode | null;
  private baseHue: number;

  constructor(getAnalyser: () => AnalyserNode | null, baseHue = 254) {
    this.getAnalyser = getAnalyser;
    this.baseHue = baseHue;
    this.left = this.make("left");
    this.right = this.make("right");
    document.body.append(this.left, this.right);
    window.addEventListener("resize", this.resize);
    this.resize();
    const tick = () => {
      requestAnimationFrame(tick);
      this.frame();
    };
    requestAnimationFrame(tick);
  }

  private make(side: "left" | "right"): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.style.position = "fixed";
    c.style.top = "0";
    c.style.setProperty(side, "0");
    c.style.height = "100vh";
    c.style.width = `${CANVAS_W}px`;
    c.style.pointerEvents = "none";
    c.style.zIndex = "5";
    return c;
  }

  private resize = () => {
    for (const c of [this.left, this.right]) {
      c.width = CANVAS_W;
      c.height = window.innerHeight;
    }
  };

  private frame(): void {
    const analyser = this.getAnalyser();
    if (!analyser) return;
    if (!this.data || this.data.length !== analyser.frequencyBinCount) {
      this.data = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i];
    const vol = Math.min(1, (sum / this.data.length / 255) * 3);
    this.draw(this.left, "left", this.data, vol);
    this.draw(this.right, "right", this.data, vol);
  }

  private draw(
    canvas: HTMLCanvasElement,
    side: "left" | "right",
    bands: Uint8Array,
    vol: number,
  ): void {
    const g = canvas.getContext("2d");
    if (!g) return;
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);
    const maxBin = Math.min(bands.length - 1, 720);
    const segH = H / BAND_COUNT;
    const hue = (this.baseHue + vol * 60) % 360;
    for (let i = 0; i < BAND_COUNT; i++) {
      // i = 0 is the bottom (bass); log-scale the bins up to the highs.
      const t = i / (BAND_COUNT - 1);
      const bin = Math.max(1, Math.round(Math.pow(maxBin, t)));
      let v = 0;
      let cnt = 0;
      for (let b = bin; b <= Math.min(bin + 2, maxBin); b++) {
        v += bands[b];
        cnt++;
      }
      v = v / cnt / 255;
      if (v < 0.03) continue;
      const y = H - (i + 1) * segH;
      const alpha = v * v * (0.25 + vol * 0.45);
      const color = `hsla(${hue}, 90%, ${40 + v * 35}%, ${alpha})`;
      const grad =
        side === "left"
          ? g.createLinearGradient(0, 0, W, 0)
          : g.createLinearGradient(W, 0, 0, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "hsla(0, 0%, 0%, 0)");
      g.fillStyle = grad;
      g.fillRect(0, y + 1, W, Math.max(1, segH - 2));
    }
  }
}
