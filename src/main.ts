import "./theme.css";
import { QupiAudio } from "./audio";
import { Turntable } from "./turntable";
import { EdgeSpectrum } from "./spectrum";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="wordmark"><b>QUPI</b><span>turntable</span></div>
  <div class="deck">
    <div class="record" role="button" tabindex="0" aria-label="Record — tap to play, drag to scratch">
      <div class="disc">
        <div class="grooves"></div>
        <div class="reflection"></div>
        <div class="ring1"><div class="ring2"><div class="label"><div class="hole"></div></div></div></div>
      </div>
    </div>
    <div class="status" id="status">Load a track, then tap the record</div>
  </div>
  <div class="controls">
    <button class="btn primary" id="load">Load track</button>
    <input type="file" id="file" accept="audio/*" />
    <div class="hint">tap play · drag scratch · wheel jog</div>
  </div>
`;

const record = app.querySelector<HTMLElement>(".record")!;
const disc = app.querySelector<HTMLElement>(".disc")!;
const status = app.querySelector<HTMLElement>("#status")!;
const loadBtn = app.querySelector<HTMLButtonElement>("#load")!;
const fileInput = app.querySelector<HTMLInputElement>("#file")!;

const audio = new QupiAudio();
new EdgeSpectrum(() => audio.analyser);
let trackName = "";

const turntable = new Turntable(disc, record, audio, (playing) => {
  if (!audio.loaded) {
    status.textContent = "Load a track first";
    return;
  }
  void playing;
});

loadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  status.textContent = "Decoding…";
  try {
    await audio.loadFile(file);
    trackName = file.name.replace(/\.[^.]+$/, "");
    status.textContent = `${trackName} — tap the record to play`;
  } catch (e) {
    status.textContent = `Could not decode ${file.name}`;
    console.error(e);
  }
});

record.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    turntable.togglePlay();
  }
});

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
setInterval(() => {
  if (!audio.loaded) return;
  const playing = turntable.playing || turntable.isDragging();
  const tag = playing
    ? ` · ${fmt(audio.position)} / ${fmt(audio.duration)}  ·  ${audio
        .getSpeed()
        .toFixed(2)}×`
    : "";
  status.textContent = `${trackName}${tag}`;
}, 120);
