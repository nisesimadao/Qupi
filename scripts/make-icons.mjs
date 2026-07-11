// Render the record to PNG app icons (192 / 512) by reusing its CSS, so the
// home-screen icon is the real Qupi platter.
import { chromium } from "playwright";

const CSS = `
  * { box-sizing: border-box; margin: 0; }
  body { width: 100vw; height: 100vh; display: grid; place-items: center;
    background: #0c0c12; }
  .disc { width: 82vmin; height: 82vmin; border-radius: 50%; background: #111;
    border: 1px solid #222; position: relative; box-shadow: 0 6vmin 12vmin rgba(0,0,0,.5); }
  .grooves { position: absolute; inset: 3%; border-radius: 50%;
    background: repeating-radial-gradient(circle at center, transparent 0, transparent 1.4%,
      rgba(255,255,255,.05) 1.55%, transparent 1.7%); }
  .reflection { position: absolute; inset: 0; border-radius: 50%;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.08) 45%,
      rgba(255,255,255,.16) 50%, rgba(255,255,255,.08) 55%, transparent 70%); }
  .ring1 { position: absolute; inset: 4%; border-radius: 50%; border: 1px solid #1a1a1a;
    display: grid; place-items: center; }
  .ring2 { width: 91.5%; height: 91.5%; border-radius: 50%; border: 1px solid #2a2a2a;
    display: grid; place-items: center; }
  .label { width: 44%; height: 44%; border-radius: 50%; background: #9b8ec4;
    border: 2px solid #000; display: grid; place-items: center; }
  .hole { width: 6%; height: 6%; border-radius: 50%; background: #0c0c12; }
`;
const HTML = `<!doctype html><style>${CSS}</style>
  <div class="disc"><div class="grooves"></div><div class="reflection"></div>
  <div class="ring1"><div class="ring2"><div class="label"><div class="hole"></div></div></div></div></div>`;

const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(HTML);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `public/icon-${size}.png` });
  await page.close();
  console.log(`wrote public/icon-${size}.png`);
}
await browser.close();
