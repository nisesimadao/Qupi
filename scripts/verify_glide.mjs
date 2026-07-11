import { chromium } from "playwright";
const b = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const p = await b.newPage({ viewport: { width: 900, height: 1100 } });
await p.goto("http://localhost:4174/", { waitUntil: "load" });
await p.waitForTimeout(1200);
const box = await p.locator(".record").boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
const r = box.width * 0.35;
// A quick clockwise flick, then let go.
await p.mouse.move(cx + r, cy);
await p.mouse.down();
for (let a = 0; a <= Math.PI * 1.2; a += Math.PI / 10) {
  await p.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
  await p.waitForTimeout(12);
}
await p.mouse.up();
const angle = () =>
  p.$eval(".disc", (el) => {
    const m = /rotate\(([-0-9.]+)deg\)/.exec(el.style.transform);
    return m ? parseFloat(m[1]) : 0;
  });
const a0 = await angle();
await p.waitForTimeout(400);
const a1 = await angle();
await p.waitForTimeout(1200);
const a2 = await angle();
console.log(`angle just after release: ${a0.toFixed(1)}`);
console.log(`+400ms: ${a1.toFixed(1)}  (moved ${(a1 - a0).toFixed(1)}deg)`);
console.log(`+1600ms: ${a2.toFixed(1)} (moved ${(a2 - a1).toFixed(1)}deg)`);
console.log(
  a1 !== a0 ? "GLIDING ✓ (coasts after release)" : "not gliding ✗",
);
await b.close();
