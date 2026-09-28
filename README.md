# QUPI

Qupi is a browser-based turntable for scratching audio files.
Playback speed and pitch follow the record's angular velocity, and reversing the platter reverses playback.
It works in desktop and mobile browsers.

[![Live](https://img.shields.io/badge/%E2%96%B6_live-nisesimadao.github.io%2FQupi-9b8ec4)](https://nisesimadao.github.io/Qupi/)
[![Deploy](https://github.com/nisesimadao/Qupi/actions/workflows/pages.yml/badge.svg)](https://github.com/nisesimadao/Qupi/actions/workflows/pages.yml)
[![Web](https://img.shields.io/badge/web-Vite%20%2B%20TypeScript-6aab96)](#develop)

<img src="docs/screenshot.png" alt="Qupi" width="720" />

[日本語版 README](./README_jp.md)

The platter's angular velocity is the primary playback state.
Audio speed is calculated as `velocity ÷ reference`, so the interface and audio engine use the same rotation value rather than synchronizing separate animation and playback states.

Audio runs in an `AudioWorklet` that implements a variable-speed playback head.
Qupi does not require `SharedArrayBuffer`, so it can be hosted as a static site on GitHub Pages.

> The native edition for Trimui Brick, desktop systems, and Raspberry Pi is [Qupi-Rust](https://github.com/nisesimadao/Qupi-Rust).
> It uses a software-rendered UI and gamepad controls.

## Features

- **Audio-file scratching**: load an audio file and control playback from the platter.
- **Rotation-based playback**: pitch bend and reverse playback are derived from platter speed.
- **Static web app**: the project can be deployed without an application server.
- **Mobile support**: the interface works in modern desktop and mobile browsers.
- **No additional permissions**: open the site and select a local audio file.

## Controls

- **Tap** the record to toggle playback.
- **Drag** to scratch: down or left moves forward; up or right rewinds.
- Use the **mouse wheel** to jog.

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build   # → dist/
```

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on pushes to `main`.

## Credits

- **[Vite](https://vite.dev/)**: build tooling (MIT).
- The turntable physics and `scratch-processor` AudioWorklet are adapted from an earlier nisesimadao implementation.
