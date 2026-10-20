/* ==========================================================================
   frame.js — --chrome, and the keyboard. Spec: elements/frame.md
   --------------------------------------------------------------------------
   1. --chrome: the frame's height that isn't room for content (the bars,
      their safe areas, the scroll region's padding), measured in px when
      anything in the frame changes size. The study card reads it; without
      script it falls back to 100svh.
   2. data-keyboard, on the frame holding the focused field while the
      on-screen keyboard is up; frame.css hides the Tab bar under it. The
      keyboard shows only as lost height (iOS shrinks the visual viewport;
      Android, with interactive-widget=resizes-content, the page). So: a
      text field has focus, and the viewport is over 150px shorter than the
      tallest seen at this width (so a rotation never counts).
   ========================================================================== */
(function () {
  "use strict";

  function measure(frame) {
    var scroll = frame.querySelector(":scope > .frame__scroll");
    if (!scroll) return;
    var cs = getComputedStyle(scroll);
    var room = scroll.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var chrome = frame.getBoundingClientRect().height - room;
    frame.style.setProperty("--chrome", Math.max(0, Math.round(chrome)) + "px");
  }

  if ("ResizeObserver" in window) {
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
  }

  var vv = window.visualViewport, tallest = {}; // px, by viewport width
  var TEXT = /^(text|search|email|url|tel|password|number)$/;

  function typing(el) { // brings up the keyboard
    if (!el || el.readOnly || el.disabled || el.inputMode === "none") return false;
    return el.isContentEditable || el.localName === "textarea" ||
      (el.localName === "input" && TEXT.test(el.type));
  }

  function keyboard() {
    var w = document.documentElement.clientWidth;
    var h = vv ? vv.height * vv.scale : innerHeight; // a pinch zoom isn't lost height
    tallest[w] = Math.max(tallest[w] || 0, h);
    var el = document.activeElement;
    var frame = typing(el) && tallest[w] - h > 150 ? el.closest(".frame") : null;
    Array.prototype.forEach.call(document.querySelectorAll(".frame[data-keyboard]"), function (f) {
      if (f !== frame) f.removeAttribute("data-keyboard");
    });
    if (frame) frame.setAttribute("data-keyboard", "");
  }

  (vv || window).addEventListener("resize", keyboard);
  document.addEventListener("focusin", keyboard);
  document.addEventListener("focusout", function () { setTimeout(keyboard); }); // once focus lands
  keyboard();
})();
