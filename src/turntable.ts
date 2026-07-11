// The turntable's physics (spec §3), ported from the portfolio's Hero.tsx.
// Rotation is the truth: the platter's angular velocity is the only real state,
// and the audio speed is derived from it every frame. Drag to scratch, wheel to
// jog, tap to play/stop.

import type { QupiAudio } from "./audio";

const NORMAL_SPEED = 90; // deg/s — one turn every 4 s
const AUDIO_REF = 90; // deg/s that maps to 1.0× playback
const SPIN_ACCEL = 2.5; // /s — chase toward the target speed
const MAX_SPEED = 1350; // deg/s — hard-scratch cap (±)
const DRAG_SENS = 0.9; // deg per pixel
const WHEEL_SENS = 0.4; // deg per wheel delta
const WHEEL_SNAP = 35; // /s — jog spend rate
const TAP_MOVE = 6; // px — beyond this a press is a scratch, not a tap
const TAP_TIME = 250; // ms

export class Turntable {
  angle = 0;
  speed = 0; // deg/s
  playing = false;
  ratio = 0; // last speed ratio (spin + jog) / reference
  private wheelPending = 0;
  private dragging = false;
  private lastMove = 0;
  private moved = 0;
  private pressStart = 0;
  private wasDrag = false;
  private lastPt = { x: 0, y: 0, t: 0 };
  private lastSent = 0;
  private disc: HTMLElement;
  private record: HTMLElement;
  private audio: QupiAudio;
  private onToggle?: (playing: boolean) => void;

  constructor(
    disc: HTMLElement,
    record: HTMLElement,
    audio: QupiAudio,
    onToggle?: (playing: boolean) => void,
  ) {
    this.disc = disc;
    this.record = record;
    this.audio = audio;
    this.onToggle = onToggle;
    this.attach();
    let last = performance.now();
    const tick = (now: number) => {
      requestAnimationFrame(tick);
      this.step(Math.min((now - last) / 1000, 0.1), now);
      last = now;
    };
    requestAnimationFrame(tick);
  }

  togglePlay(): void {
    this.playing = !this.playing;
    void this.audio.resume();
    this.onToggle?.(this.playing);
  }

  isDragging(): boolean {
    return this.dragging;
  }

  private step(dt: number, now: number): void {
    if (this.dragging) {
      // A finger holding the platter still brakes it quickly.
      if (now - this.lastMove > 60) this.speed *= Math.exp(-dt * 25);
    } else if (this.playing || Math.abs(this.speed) >= 0.5) {
      const target = this.playing ? NORMAL_SPEED : 0;
      this.speed += (target - this.speed) * Math.min(1, dt * SPIN_ACCEL);
      this.angle = (this.angle + this.speed * dt) % 360;
    } else {
      this.speed = 0;
    }

    let wheelVel = 0;
    if (Math.abs(this.wheelPending) > 0.01) {
      const stepv = this.wheelPending * Math.min(1, dt * WHEEL_SNAP);
      this.wheelPending -= stepv;
      this.angle = (this.angle + stepv) % 360;
      wheelVel = stepv / dt;
    } else {
      this.wheelPending = 0;
    }

    this.disc.style.transform = `rotate(${this.angle}deg)`;

    const audioSpeed = this.speed + wheelVel;
    this.ratio = audioSpeed / AUDIO_REF;
    if (audioSpeed !== 0 || this.lastSent !== 0) {
      this.audio.setSpeed(this.ratio);
      this.lastSent = audioSpeed;
    }
  }

  private attach(): void {
    const r = this.record;
    r.addEventListener("pointerdown", (e) => {
      r.setPointerCapture(e.pointerId);
      this.dragging = true;
      r.classList.add("dragging");
      this.wasDrag = false;
      this.moved = 0;
      this.pressStart = performance.now();
      this.lastPt = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.lastMove = performance.now();
      void this.audio.resume();
    });
    r.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const now = performance.now();
      const p = this.lastPt;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const dt = Math.max((now - p.t) / 1000, 0.001);
      this.lastPt = { x: e.clientX, y: e.clientY, t: now };
      this.lastMove = now;
      this.moved += Math.abs(dx) + Math.abs(dy);
      const d = (dy - dx) * DRAG_SENS; // down/left = forward
      this.angle = (this.angle + d) % 360;
      const inst = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, d / dt));
      this.speed = this.speed * 0.55 + inst * 0.45;
    });
    const up = () => {
      if (!this.dragging) return;
      this.dragging = false;
      r.classList.remove("dragging");
      this.wasDrag =
        this.moved > TAP_MOVE || performance.now() - this.pressStart > TAP_TIME;
    };
    r.addEventListener("pointerup", up);
    r.addEventListener("pointercancel", up);
    r.addEventListener("click", () => {
      if (this.wasDrag) {
        this.wasDrag = false;
        return;
      }
      this.togglePlay();
    });
    r.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        void this.audio.resume();
        const d = (e.deltaY - e.deltaX) * WHEEL_SENS;
        this.wheelPending = Math.max(-720, Math.min(720, this.wheelPending + d));
      },
      { passive: false },
    );
  }
}
