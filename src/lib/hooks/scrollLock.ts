/**
 * Ref-counted lock on page scrolling for modals, drawers and sheets.
 *
 * Overlays can open and close in overlapping order (e.g. a portion sheet over a recipe drawer, or a
 * drawer replacing another during navigation). Saving and restoring `body.style.overflow` per overlay
 * then leaves the page stuck on `hidden`; counting locks restores it only when the last one releases.
 *
 *   useEffect(() => lockBodyScroll(), []);
 */
let locks = 0;
let original = "";

/** Locks body scrolling and returns the matching unlock function (safe to call more than once). */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (locks === 0) {
    original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.body.style.overflow = original;
  };
}
