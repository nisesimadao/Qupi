# Qupi

A scratchable turntable in the browser — the flagship **web edition** of Qupi, for
the desktop and the phone. Rotation is the truth; the sound follows the spin: slow
the platter and the pitch drops, scratch it and it reverses.

Built with **Vite + TypeScript + Web Audio** (an `AudioWorklet` variable-speed
head, no SharedArrayBuffer, so it hosts cleanly on GitHub Pages). The turntable
and audio engine are ported from the portfolio site's components. The
**native / handheld** edition (Trimui Brick, desktop, Raspberry Pi) is its Rust
sibling, [Qupi-Rust](https://github.com/nisesimadao/Qupi-Rust).

## Develop

```sh
npm install
npm run dev
```

## Build & deploy

```sh
npm run build   # → dist/
```

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on every
push to `main` (served under `/Qupi/`).

## Controls

- **Tap** the record to play / stop.
- **Drag** it to scratch (down/left = forward, up/right = rewind).
- **Wheel** to jog.

Drop in any audio file with **Load track**.

## Credits

- **[Vite](https://vite.dev/)** — build tooling (MIT).
- Turntable physics and the `scratch-processor` AudioWorklet are adapted from the
  nisesimadao portfolio.
