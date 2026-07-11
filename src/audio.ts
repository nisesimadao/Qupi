// The audio engine, adapted from the portfolio's audioEngine.ts: an AudioWorklet
// (scratch-processor.js) plays a decoded track at a variable speed set as an
// a-rate AudioParam, with an AnalyserNode for the spectrum. No SharedArrayBuffer,
// so it runs on GitHub Pages. Here it loads a user-chosen file instead of a fixed
// BGM, so Qupi is a real deck.

const WORKLET_URL = import.meta.env.BASE_URL + "scratch-processor.js";

export class QupiAudio {
  ctx: AudioContext | null = null;
  node: AudioWorkletNode | null = null;
  analyser: AnalyserNode | null = null;
  duration = 0;
  position = 0; // seconds, updated from the worklet ~23×/s
  private ratio = 0;

  async ensure(): Promise<void> {
    if (this.ctx) return;
    const ctx = new AudioContext();
    await ctx.audioWorklet.addModule(WORKLET_URL);
    const node = new AudioWorkletNode(ctx, "scratch-player", {
      numberOfInputs: 0,
      outputChannelCount: [2],
    });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    node.connect(analyser);
    analyser.connect(ctx.destination);
    node.port.onmessage = (e) => {
      if (typeof e.data.pos === "number") this.position = e.data.pos;
    };
    this.ctx = ctx;
    this.node = node;
    this.analyser = analyser;
  }

  async resume(): Promise<void> {
    await this.ctx?.resume();
  }

  /** Decode a file and hand its PCM to the worklet. Returns the AudioBuffer so
   *  the caller can build the waveform. */
  async loadFile(file: File): Promise<AudioBuffer> {
    await this.ensure();
    const audio = await this.ctx!.decodeAudioData(await file.arrayBuffer());
    const channels: Float32Array[] = [];
    for (let c = 0; c < audio.numberOfChannels; c++) {
      channels.push(audio.getChannelData(c));
    }
    this.node!.port.postMessage({ channels, sampleRate: audio.sampleRate });
    this.duration = audio.duration;
    this.position = 0;
    return audio;
  }

  /** Set the playback rate (1 = normal, negative = reverse), smoothed ~8 ms. */
  setSpeed(ratio: number): void {
    this.ratio = ratio;
    if (!this.node || !this.ctx) return;
    this.node.parameters
      .get("speed")
      ?.setTargetAtTime(ratio, this.ctx.currentTime, 0.008);
  }
  getSpeed(): number {
    return this.ratio;
  }

  seekBy(seconds: number): void {
    this.node?.port.postMessage({ seekBy: seconds });
  }
  seekTo(seconds: number): void {
    this.seekBy(seconds - this.position);
  }
  get loaded(): boolean {
    return this.duration > 0;
  }
}
