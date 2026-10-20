/* ==========================================================================
   sheet.js — drag a bottom sheet down to close it. Spec: elements/sheet.md
   --------------------------------------------------------------------------
   A finger, or any pointer, on a bottom sheet's top bar (anywhere but its
   buttons) moves the sheet with it, down only. Let go past a third of the
   sheet's height, or with a flick down, and it closes the way Close does:
   this presses Close, so returnValue is Close's and focus goes back to the
   opener (dialog.js where the browser can't). Short of that, it settles
   back. A drag only starts on the bar, so the body scrolls as it always
   does, and Close stays: the drag is never the only way out.

   Bottom sheets only: a side sheet runs from the top edge to the bottom
   one, so a sheet that touches the top doesn't drag. No detents: a sheet is
   as tall as its task, so there is one place for it to be, and one way to
   go. Under reduced motion it still follows the finger (the hand moves it,
   not an animation), but nothing travels by itself: let go, it fades out
   where it is, or fades back in at its place. Where the sheet's motion
   isn't supported, it closes or settles in place.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.PointerEvent || !window.HTMLDialogElement) return;
  var drag = null;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)");

  // a duration from the CSS, in milliseconds: the longest in a computed
  // transition-duration, which is a list in seconds
  function ms(list) {
    return String(list).split(",").reduce(function (m, v) { return Math.max(m, (parseFloat(v) || 0) * 1000); }, 0);
  }
  // under reduced motion a sheet let go fades out where it was dropped:
  // put it back in place once the fade is over, ready for next time
  function reset(s) {
    var timer, done = function (e) {
      if (e && (e.target !== s || e.propertyName !== "opacity")) return;
      clearTimeout(timer);
      s.removeEventListener("transitionend", done);
      s.removeEventListener("transitioncancel", done);
      s.style.transform = "";
    };
    s.addEventListener("transitionend", done);
    s.addEventListener("transitioncancel", done);
    timer = setTimeout(done, ms(getComputedStyle(s).transitionDuration));
  }

  document.addEventListener("pointerdown", function (e) {
    if (drag || !e.isPrimary || e.button > 0) return;
    var bar = e.target.closest && e.target.closest("dialog.sheet[open] > .topbar");
    var hit = bar && e.target.closest("button, a, input, select, textarea, label, [tabindex]");
    if (!bar || (hit && bar.contains(hit))) return; // a button is pressed, not dragged
    var box = bar.parentNode.getBoundingClientRect();
    if (box.top <= 0) return; // from the top edge down: a side sheet
    drag = { sheet: bar.parentNode, id: e.pointerId, y: e.clientY, h: box.height, dy: 0, trail: [[e.timeStamp, 0]] };
    bar.setPointerCapture(e.pointerId);
    if (e.pointerType === "mouse") e.preventDefault(); // no text selection
  });

  document.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    drag.trail.push([e.timeStamp, drag.dy]);
    if (drag.trail.length > 4) drag.trail.shift();
    drag.sheet.style.transition = "none"; // it is the finger's now
    drag.sheet.style.transform = "translateY(" + drag.dy + "px)";
  });

  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag, s = d.sheet, first = d.trail[0], fade = still && still.matches;
    drag = null;
    // speed down over the last few moves, in px per millisecond; it falls
    // towards nothing if the finger stopped before it let go
    var speed = (d.dy - first[1]) / Math.max(1, e.timeStamp - first[0]);
    var out = e.type === "pointerup" && (d.dy > d.h / 3 || (speed > 0.5 && d.dy > 24));
    s.style.transition = ""; // the sheet's own transition again (sheet.css)
    if (!out) {
      s.style.transform = ""; // settles back from where it is
      if (fade && d.dy && s.animate) {
        var cs = getComputedStyle(s);
        s.animate({ opacity: [0, 1] }, { duration: ms(cs.transitionDuration), easing: cs.transitionTimingFunction.match(/^[^,(]+(\([^)]*\))?/)[0] });
      }
      return;
    }
    if (!fade) s.style.transform = ""; // the exit takes it on from here
    var close = s.querySelector(':scope > .topbar form[method="dialog"] button');
    if (close) close.click();
    else s.close();
    if (fade) reset(s);
  }
  document.addEventListener("pointerup", release);
  document.addEventListener("pointercancel", release);

  // closed some other way mid-drag (Escape): drop the drag, and the sheet
  // opens in its place next time
  document.addEventListener("close", function (e) {
    if (!drag || drag.sheet !== e.target) return;
    drag.sheet.style.transition = drag.sheet.style.transform = "";
    drag = null;
  }, true);
})();
