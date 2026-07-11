// Headless screenshot for design checks: load the served app, optionally act, snap.
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:4173/Qupi/";
const out = process.argv[3] || "shot.png";

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(1200); // let the default track decode
if (process.argv[4] === "play") {
  await page.click(".record"); // tap to play
  await page.waitForTimeout(1800); // let it spin up and the spectrum fill
}
await page.screenshot({ path: out });
await browser.close();
console.log("wrote", out);
