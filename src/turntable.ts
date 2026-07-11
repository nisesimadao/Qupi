// The turntable's physics (spec §3), ported from the portfolio's Hero.tsx.
// Rotation is the truth: the platter's angular velocity is the only real state,
// and the audio speed is derived from it every frame. Drag to scratch, wheel to
// jog, tap to play/stop.

import type { QupiAudio } from "./audio";

const NORMAL_SPEED = 90; // deg/s — one turn every 4 s
const AUDIO_REF = 90; // deg/s that maps to 1.0× playback
const SPIN_ACCEL = 2.5; // /s — chase 33⅓ when the motor is on
const COAST_FRICTION = 0.9; // /s — motor-off glide; low, so a flick spins on
const MAX_SPEED = 1350; // deg/s — hard-scratch cap (±)
const WHEEL_SENS = 0.4; // deg per wheel delta
const WHEEL_SNAP = 35; // /s — jog spend rate
const TAP_MOVE = 6; // deg — beyond this turn a press is a scratch, not a tap
const TAP_TIME = 250; // ms

export class Turntable {
  angle = 0;
  speed = 0; // deg/s
  playing = false;
  ratio = 0; // last speed ratio (spin + jog) / reference
  private wheelPending = 0;
  private dragging = false;
  private lastMove = 0;
  private moved = 0; // degrees turned during this gesture (for tap vs scratch)
  private pressStart = 0;
  private wasDrag = false;
  private center = { x: 0, y: 0 }; // record centre, cached at grab time
  private lastAngle = 0; // radians — pointer angle around the centre
  private lastT = 0;
  private lastVibrate = 0;
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
      // A finger holding the platter still brakes it — but gently, so it feels
      // like a slipmat under your hand, not a hard clutch.
      if (now - this.lastMove > 60) this.speed *= Math.exp(-dt * 16);
    } else if (this.playing) {
      // Motor on: ease up to and hold 33⅓.
      this.speed += (NORMAL_SPEED - this.speed) * Math.min(1, dt * SPIN_ACCEL);
      this.angle = (this.angle + this.speed * dt) % 360;
    } else if (Math.abs(this.speed) >= 0.3) {
      // Motor off: the platter glides on its slipmat. Low friction, so a flick
      // keeps spinning a good while and coasts down smoothly.
      this.speed *= Math.exp(-dt * COAST_FRICTION);
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
      const rect = r.getBoundingClientRect();
      this.center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      this.lastAngle = Math.atan2(
        e.clientY - this.center.y,
        e.clientX - this.center.x,
      );
      this.lastT = performance.now();
      this.lastMove = performance.now();
      void this.audio.resume();
    });
    r.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const now = performance.now();
      const dt = Math.max((now - this.lastT) / 1000, 0.001);
      this.lastT = now;
      this.lastMove = now;
      // Scratch by the *rotation* of the pointer around the record's centre, so
      // turning it clockwise always goes forward and anticlockwise reverses — no
      // matter which side of the platter you grab.
      const a = Math.atan2(e.clientY - this.center.y, e.clientX - this.center.x);
      let d = a - this.lastAngle;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest signed delta
      this.lastAngle = a;
      const deltaDeg = (d * 180) / Math.PI;
      this.angle = (this.angle + deltaDeg) % 360;
      this.moved += Math.abs(deltaDeg);
      const inst = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, deltaDeg / dt));
      // Lean a little more on the live velocity so a flick's momentum carries
      // into the coast (a slippier release).
      this.speed = this.speed * 0.45 + inst * 0.55;
      // A little tactile buzz on phones that have a motor.
      if (now - this.lastVibrate > 45 && "vibrate" in navigator) {
        this.lastVibrate = now;
        navigator.vibrate(6);
      }
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
