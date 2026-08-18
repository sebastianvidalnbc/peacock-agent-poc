import { useEffect } from "react";

/**
 * Anchors the app to the mobile *visual* viewport (the area not covered by the
 * iOS software keyboard). It does two things:
 *
 *   1. Exposes the visible height to CSS as `--visual-viewport-height`, so the
 *      fixed app shell can shrink when the keyboard opens.
 *   2. Neutralizes Safari's focus-scroll: when a textarea is focused iOS scrolls
 *      the *layout* viewport upward to reveal the field, which drags a fixed
 *      shell (and its header) off the top of the screen. We reset the window
 *      scroll back to the origin so the shell stays pinned to the phone's top.
 *
 * Why height (not `offsetTop` translate): `100dvh` tracks the layout viewport,
 * which on iOS does not shrink for the keyboard. `visualViewport.height` does.
 * We intentionally do NOT translate the app by `offsetTop` — the shell is
 * `position: fixed; inset: 0`, so it must stay at the viewport origin; the only
 * use of the layout shift is to detect and undo it. Falls back to CSS `100dvh`
 * where `visualViewport` is unavailable (desktop / older browsers).
 */
export function useVisualViewport(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;

    // No visualViewport (desktop / unsupported): keep the CSS 100dvh fallback.
    if (!vv) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      // Drive the fixed shell's height from the visible viewport height only.
      root.style.setProperty("--visual-viewport-height", `${Math.round(vv.height)}px`);

      // Undo Safari's focus-scroll so the fixed shell (and header) stay anchored
      // to the top of the visible viewport instead of being pushed off-screen.
      // Only correct an actual upward shift; never fight the conversation's own
      // internal scroll (that lives on .chat, not the window).
      if (window.scrollY !== 0) window.scrollTo(0, 0);
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
      root.style.removeProperty("--visual-viewport-height");
    };
  }, []);
}
