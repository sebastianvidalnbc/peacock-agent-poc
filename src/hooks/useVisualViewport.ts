import { useEffect } from "react";

/**
 * Tracks the mobile *visual* viewport (the area not covered by the iOS software
 * keyboard or Safari's dynamic browser chrome) and exposes it to CSS as:
 *
 *   --app-viewport-height : the height the app shell should occupy right now
 *   --keyboard-offset     : how much the keyboard currently intrudes (px)
 *
 * Why: `100dvh` tracks the *layout* viewport, which on iOS Safari does not
 * shrink when the keyboard opens — so a bottom-docked composer ends up behind
 * the keyboard. `window.visualViewport` does report the keyboard, so we drive
 * the shell height from it and let CSS fall back to `100dvh` when the API is
 * absent (desktop, older browsers). This never scrolls the document.
 */
export function useVisualViewport(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;

    // No visualViewport (desktop / unsupported): leave the CSS fallback of
    // 100dvh in place and do nothing.
    if (!vv) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      // Visible height = the visual viewport height. offsetTop accounts for the
      // page being pushed up when the keyboard opens on some iOS versions.
      const height = vv.height;
      // Keyboard intrusion relative to the layout viewport. Clamp to >= 0 so a
      // small rounding negative never adds phantom space.
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--app-viewport-height", `${Math.round(height)}px`);
      root.style.setProperty("--keyboard-offset", `${Math.round(keyboard)}px`);
    };

    // Coalesce bursty resize/scroll events (keyboard animation) into one paint.
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      // Restore the CSS fallback so nothing is left pinned to a stale height.
      root.style.removeProperty("--app-viewport-height");
      root.style.removeProperty("--keyboard-offset");
    };
  }, []);
}
