import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

// A tiny valid 16-bit PCM WAV (1s sine), to feed the file input.
function wav(seconds = 1, rate = 44100, freq = 440) {
  const n = seconds * rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.sin((2 * Math.PI * freq * i) / rate) * 0.3;
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}
writeFileSync("scripts/test.wav", wav());

const b = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const p = await b.newPage({ viewport: { width: 900, height: 1100 } });
p.on("console", (m) => console.log("[page]", m.text()));
p.on("pageerror", (e) => console.log("[pageerror]", e.message));
await p.goto("http://localhost:4174/", { waitUntil: "load" });
await p.waitForTimeout(1400);
await p.setInputFiles("#file", "scripts/test.wav");
await p.waitForTimeout(1500);
console.log("STATUS:", await p.$eval("#status", (el) => el.textContent));
await b.close();
