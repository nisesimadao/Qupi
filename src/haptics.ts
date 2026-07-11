// Tactile feedback across platforms.
//
// Android/Chrome expose the Vibration API. iOS Safari does *not* (and never has),
// but iOS 18 gives native <input type="checkbox" switch> toggles real haptics — so
// we keep one such switch parked off-screen and "click" it to tap the Taptic engine.
// Both paths only fire inside a user gesture, which is exactly when we call them
// (a scratch drag, a tap to play).
// ref: https://zenn.dev/dev_commune/articles/1ae0b3744b04ca

const canVibrate =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

let iosSwitch: HTMLInputElement | null = null;

function iosTick(): void {
  if (!iosSwitch) {
    iosSwitch = document.createElement("input");
    iosSwitch.type = "checkbox";
    iosSwitch.setAttribute("switch", ""); // the iOS 18 native switch is haptic
    iosSwitch.tabIndex = -1;
    iosSwitch.setAttribute("aria-hidden", "true");
    // Rendered (haptics need a live element) but invisible and inert.
    iosSwitch.style.cssText =
      "position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;" +
      "pointer-events:none;border:0;margin:0;padding:0;";
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click(); // toggling the switch taps the Taptic engine
}

/** A short tactile tick. Safe to call often — callers throttle it. */
export function haptic(ms = 6): void {
  if (canVibrate) {
    navigator.vibrate(ms);
    return;
  }
  iosTick();
}
