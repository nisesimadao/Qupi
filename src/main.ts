import "./theme.css";
import { QupiAudio } from "./audio";
import { Turntable } from "./turntable";
import { EdgeSpectrum } from "./spectrum";
import { SeekBar } from "./seekbar";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="topbar">
    <div class="wordmark"><b>QUPI</b><span>turntable</span></div>
    <button class="loader" id="loader" aria-label="Load a track" title="Load a track">♪</button>
  </div>
  <div class="deck">
    <div class="record" role="button" tabindex="0" aria-label="Record — tap to play, drag to scratch">
      <div class="disc">
        <div class="grooves"></div>
        <div class="reflection"></div>
        <div class="ring1"><div class="ring2"><div class="label"><div class="hole"></div></div></div></div>
      </div>
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
`;

const record = app.querySelector<HTMLElement>(".record")!;
const disc = app.querySelector<HTMLElement>(".disc")!;
const status = app.querySelector<HTMLElement>("#status")!;
const loader = app.querySelector<HTMLButtonElement>("#loader")!;
const panel = app.querySelector<HTMLElement>("#panel")!;
const fileBtn = app.querySelector<HTMLButtonElement>("#file-btn")!;
const fileInput = app.querySelector<HTMLInputElement>("#file")!;
const urlInput = app.querySelector<HTMLInputElement>("#url")!;
const urlBtn = app.querySelector<HTMLButtonElement>("#url-btn")!;

const audio = new QupiAudio();
new EdgeSpectrum(() => audio.analyser);
const seek = new SeekBar(audio);
app.querySelector(".deck")!.appendChild(seek.el);
let trackName = "";

new Turntable(disc, record, audio, (playing) => {
  if (!audio.loaded) status.textContent = "loading a track…";
  else void playing;
});

// Load a default track so it plays the instant you tap — no dialog, no friction.
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

// The loader is tucked away; open it only when you want your own track.
loader.addEventListener("click", () => {
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
    await audio.resume(); // the click is a user gesture — wake the engine
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
