/* ==========================================================================
   frame.js — publishes --chrome on every .frame. Spec: elements/frame.md
   --------------------------------------------------------------------------
   --chrome is the part of the frame's height that isn't room for content:
   the bars with their safe areas, and the scroll region's own padding. So
   100svh - var(--chrome) is the room, and the study card fits in it.

   CSS can't put a content-sized bar's height into a property, so this
   measures it, in px, whenever the frame or anything in it changes size
   (text size, a bar wrapping, a rotation). Without script --chrome stays
   unset: the study card falls back to 100svh and the region scrolls a
   little. Nothing else reads it.
   ========================================================================== */
(function () {
  "use strict";
  if (!("ResizeObserver" in window)) return;

  function measure(frame) {
    var scroll = frame.querySelector(":scope > .frame__scroll");
    if (!scroll) return;
    var cs = getComputedStyle(scroll);
    var room = scroll.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var chrome = frame.getBoundingClientRect().height - room;
    frame.style.setProperty("--chrome", Math.max(0, Math.round(chrome)) + "px");
  }

  var ro = new ResizeObserver(function (entries) {
    var done = [];
    entries.forEach(function (e) {
      var frame = e.target.classList.contains("frame") ? e.target : e.target.parentElement;
      if (frame && done.indexOf(frame) < 0) {
        done.push(frame);
        measure(frame);
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".frame"), function (frame) {
    ro.observe(frame);
    Array.prototype.forEach.call(frame.children, function (child) {
      ro.observe(child);
    });
  });
})();
