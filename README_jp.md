# QUPI

**ブラウザで動く、スクラッチできるターンテーブル。** 曲を読み込んでレコードを回し、
擦る — 遅くすればピッチが下がり、押し込めば逆再生、止めれば無音へフェード。PC でも
スマホでも動きます。

[![Live](https://img.shields.io/badge/%E2%96%B6_live-nisesimadao.github.io%2FQupi-9b8ec4)](https://nisesimadao.github.io/Qupi/)

<img src="docs/screenshot.png" alt="Qupi" width="720" />

[English README](./README.md)

Qupi の芯はひとつ:**回転が真実、音はその写像。** レコードの角速度だけが唯一の状態で、
音声は常に `角速度 ÷ 基準` で再生されます。音に絵を合わせるのではなく、すべてが盤の
回転に従います。

音声はすべて `AudioWorklet`(可変速の再生ヘッド)で動き、`SharedArrayBuffer` を使わない
ので、GitHub Pages に静的ファイルとしてそのまま置けます。

> **ネイティブ / ハンドヘルド版**(Trimui Brick・デスクトップ・Raspberry Pi 向け。
> ソフトウェア描画 UI + ゲームパッド操作)は Rust の兄弟版
> [Qupi-Rust](https://github.com/nisesimadao/Qupi-Rust) です。

## 特徴

- **どんな曲でもスクラッチ** — 音声ファイルを読み込んで盤を操作。
- **本物のターンテーブル感** — 後付けエフェクトではなく、回転から生まれる本物のピッチ
  ベンドと逆再生。
- **どこでも動く** — 数 kB の JS の小さな静的サイト。モバイル含めどのブラウザでも即起動。
- **インストール・権限不要** — URL だけ。

## 操作

- レコードを**タップ**で再生 / 停止。
- **ドラッグ**でスクラッチ(下 / 左 = 順方向、上 / 右 = 巻き戻し)。
- **ホイール**でジョグ。

## 開発 / ビルド

```sh
npm install
npm run dev      # 開発サーバ
npm run build    # dist/ を生成(Pages へ自動デプロイ)
```

## クレジット

- **[Vite](https://vite.dev/)** — ビルドツール(MIT)。
- ターンテーブルの物理と `scratch-processor` AudioWorklet は nisesimadao の
  ポートフォリオから流用。
