import "./theme.css";
import { QupiAudio } from "./audio";
import { Turntable } from "./turntable";
import { EdgeSpectrum } from "./spectrum";
import { SeekBar } from "./seekbar";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="topbar">
    <div class="wordmark"><b>QUPI</b><span>turntable</span></div>
    <div class="tools">
      <button class="icon-btn" id="settings" aria-label="Settings" title="Settings">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
      </button>
      <button class="icon-btn" id="loader" aria-label="Load a track" title="Load a track">
        <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 6h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S8 17.38 8 16s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V6h4v2z"/></svg>
      </button>
    </div>
  </div>
  <div class="deck">
    <div class="turntable">
      <div class="platter"></div>
      <div class="record" role="button" tabindex="0" aria-label="Record — tap to play, drag to scratch">
        <div class="disc">
          <div class="grooves"></div>
          <div class="reflection"></div>
          <div class="ring1"><div class="ring2"><div class="label"><div class="hole"></div></div></div></div>
        </div>
      </div>
      <svg class="tonearm" viewBox="0 0 100 100" aria-hidden="true">
        <g class="arm-g">
          <line class="cw-stem" x1="104" y1="-2" x2="113" y2="-11" />
          <rect class="cw" x="109" y="-17" width="11" height="10" rx="5"
            transform="rotate(-44 114.5 -12)" />
          <rect class="base" x="98" y="-8" width="12" height="12" rx="3" />
          <circle class="pivot" cx="104" cy="-2" r="2.6" />
          <line class="tube" x1="104" y1="-2" x2="88.5" y2="28" />
          <line class="tube-hi" x1="104" y1="-2" x2="88.5" y2="28" />
          <g transform="rotate(22 88.5 28)">
            <rect class="head" x="82.8" y="24.2" width="11.4" height="6.6" rx="1.4" />
            <rect class="cart" x="85.5" y="30.4" width="6" height="3.6" rx="0.7" />
            <line class="stylus" x1="88.5" y1="33.8" x2="88.5" y2="36.4" />
            <circle class="tip" cx="88.5" cy="36.6" r="1" />
          </g>
        </g>
      </svg>
    </div>
    <div class="status" id="status">loading…</div>
  </div>
  <div class="hint">tap · drag to scratch · wheel to jog</div>
  <div class="panel" id="panel" hidden>
    <button class="btn" id="file-btn">Load a file</button>
    <input type="file" id="file" accept="audio/*" />
    <div class="urlrow">
      <input type="text" id="url" inputmode="url" placeholder="…or paste an audio-file URL" />
      <button class="btn" id="url-btn">Go</button>
    </div>
    <div class="note">A direct audio-file URL (with CORS). SoundCloud page links can't be scratched.</div>
  </div>
  <div class="panel settings" id="settings-panel" hidden>
    <label><input type="checkbox" id="opt-tonearm" /> <span>Tonearm</span></label>
    <label><input type="checkbox" id="opt-platter" /> <span>Platter</span></label>
  </div>
`;

const record = app.querySelector<HTMLElement>(".record")!;
const disc = app.querySelector<HTMLElement>(".disc")!;
const turntableEl = app.querySelector<HTMLElement>(".turntable")!;
const armG = app.querySelector<SVGGElement>(".arm-g")!;
const status = app.querySelector<HTMLElement>("#status")!;
const loader = app.querySelector<HTMLButtonElement>("#loader")!;
const settingsBtn = app.querySelector<HTMLButtonElement>("#settings")!;
const panel = app.querySelector<HTMLElement>("#panel")!;
const settingsPanel = app.querySelector<HTMLElement>("#settings-panel")!;
const fileBtn = app.querySelector<HTMLButtonElement>("#file-btn")!;
const fileInput = app.querySelector<HTMLInputElement>("#file")!;
const urlInput = app.querySelector<HTMLInputElement>("#url")!;
const urlBtn = app.querySelector<HTMLButtonElement>("#url-btn")!;
const optTonearm = app.querySelector<HTMLInputElement>("#opt-tonearm")!;
const optPlatter = app.querySelector<HTMLInputElement>("#opt-platter")!;

const audio = new QupiAudio();
new EdgeSpectrum(() => audio.analyser);
const seek = new SeekBar(audio);
app.querySelector(".deck")!.insertBefore(seek.el, status.nextSibling);
let trackName = "";

const turntable = new Turntable(disc, record, audio, (playing) => {
  if (!audio.loaded) status.textContent = "loading a track…";
  else void playing;
});

audio
  .loadURL(import.meta.env.BASE_URL + "bgm.mp3")
  .then(() => {
    trackName = "Demo";
    status.textContent = "tap the record to play";
    seek.setVisible(true);
  })
  .catch(() => {
    status.textContent = "tap ♪ to load a track";
  });

// --- loaders ------------------------------------------------------------
loader.addEventListener("click", () => {
  settingsPanel.hidden = true;
  panel.hidden = !panel.hidden;
});
fileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  await load(() => audio.loadFile(file), file.name.replace(/\.[^.]+$/, ""), "file");
});
urlBtn.addEventListener("click", () => tryUrl());
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryUrl();
});
function tryUrl(): void {
  const url = urlInput.value.trim();
  if (!url) return;
  const name = decodeURIComponent(url.split("/").pop() || "track").replace(
    /\.[^.]+$/,
    "",
  );
  void load(() => audio.loadURL(url), name, "url");
}
async function load(
  fn: () => Promise<unknown>,
  name: string,
  kind: "file" | "url",
): Promise<void> {
  status.textContent = "decoding…";
  try {
    await audio.resume();
    await fn();
    trackName = name;
    status.textContent = `${trackName} — tap to play`;
    seek.setVisible(true);
    panel.hidden = true;
  } catch (e) {
    status.textContent =
      kind === "url"
        ? "couldn't load that URL (needs a direct, CORS-enabled audio file)"
        : "couldn't decode that file — try MP3, WAV, M4A, FLAC, or OGG";
    console.error("[qupi] load failed:", e);
  }
}

// --- settings: the tonearm and the platter, remembered ------------------
settingsBtn.addEventListener("click", () => {
  panel.hidden = true;
  settingsPanel.hidden = !settingsPanel.hidden;
});
function apply(name: "tonearm" | "platter", on: boolean): void {
  turntableEl.classList.toggle(`show-${name}`, on);
  localStorage.setItem(`qupi.${name}`, on ? "1" : "0");
}
optTonearm.checked = localStorage.getItem("qupi.tonearm") === "1";
optPlatter.checked = localStorage.getItem("qupi.platter") === "1";
apply("tonearm", optTonearm.checked);
apply("platter", optPlatter.checked);
optTonearm.addEventListener("change", () => apply("tonearm", optTonearm.checked));
optPlatter.addEventListener("change", () => apply("platter", optPlatter.checked));

// The needle: it tracks inward as the track plays, and drifts / trembles with the
// friction of the spin — dragged along by a scratch, shivering at speed.
function armTick(): void {
  requestAnimationFrame(armTick);
  if (!optTonearm.checked) return;
  const prog = audio.duration > 0 ? audio.position / audio.duration : 0;
  // The arm is drawn resting on the outer groove; rotate it around its pivot as
  // the track plays (needle tracks inward), plus a drift/shiver from the spin.
  const track = prog * 15;
  const r = turntable.ratio;
  const drag = Math.max(-3, Math.min(3, -r * 0.8)); // dragged against the spin
  const shiver = Math.sin(performance.now() * 0.05) * Math.min(1.3, Math.abs(r) * 0.6);
  armG.setAttribute("transform", `rotate(${track + drag + shiver} 104 -2)`);
}
requestAnimationFrame(armTick);

record.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") e.preventDefault();
});

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
setInterval(() => {
  if (!audio.loaded || panel.hidden === false) return;
  const rate = audio.getSpeed();
  const spinning = Math.abs(rate) > 0.01;
  status.textContent = spinning
    ? `${trackName} · ${fmt(audio.position)} / ${fmt(audio.duration)}  ·  ${rate.toFixed(2)}×`
    : `${trackName} — tap to play`;
}, 120);
