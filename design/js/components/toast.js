/* ==========================================================================
   Toast — "it's done", with Undo. Spec: elements/toast.md

   One at a time, put into a polite live region that is always there
   (<div class="toasts" role="status">, one per frame, after the scroll
   region): going in is what a screen reader announces, once. 6 s, 10 s with
   an action; the clock stops while a pointer is on it, focus is in it or the
   page is hidden. Its action runs and closes it; Dismiss or Escape closes
   it; Alt+T (⌥T) jumps to it, except in a field where ⌥T types a character.
   Focus goes back to where it was. While it shows, a frame's scroll region
   pads its foot by its height, so it never hides what has focus.

     var t = Flashcards.toast({ text: "Deck deleted.", action: "Undo", onAction: fn });
     <button type="button" data-toast="Couldn't sync." data-toast-action="Try again"
             data-toast-failed>Sync now</button>   (its action fires "toastaction")

   A trigger that only raises a toast may carry hidden; this shows it. The
   one global is window.Flashcards.
   ========================================================================== */
(function () {
  "use strict";
  var NS = (window.Flashcards = window.Flashcards || {});
  var queue = [], now = null;

  function button(cls, label, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + cls;
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }
  function run(t) { // start or resume the clock, unless something holds it
    if (t !== now || t.timer || t.hover || t.focus || document.hidden) return;
    t.start = Date.now();
    t.timer = setTimeout(function () { close(t); }, t.left);
  }
  function hold(t) { // stop it, keeping at least 2 s for when it resumes
    if (!t.timer) return;
    clearTimeout(t.timer);
    t.timer = 0;
    t.left = Math.max(t.left - (Date.now() - t.start), 2000);
  }
  // a frame's scroll region pads its foot by the region's height while a
  // toast shows, so focus never lands under it (WCAG 2.4.11): toast.css
  var ro = window.ResizeObserver && new ResizeObserver(function (es) {
    es.forEach(function (e) { pad(e.target); });
  });
  function pad(region) {
    var frame = region.parentElement;
    if (!frame || !frame.classList.contains("frame")) return;
    if (region.querySelector(".toast")) frame.style.setProperty("--toasts-h", region.offsetHeight + "px");
    else frame.style.removeProperty("--toasts-h");
  }
  function close(t) {
    if (queue.indexOf(t) !== -1) return void queue.splice(queue.indexOf(t), 1);
    if (t !== now) return;
    clearTimeout(t.timer);
    now = null;
    var had = t.el.contains(document.activeElement), region = t.el.parentElement;
    t.el.remove();
    if (region) pad(region);
    if (had && t.back && t.back.isConnected) t.back.focus();
    setTimeout(next, 300); // a beat between two, so new words read as a new toast
  }

  function next() {
    if (now || !queue.length) return;
    var t = queue[0], o = t.opts;
    var region = o.region || document.querySelector('.toasts[role="status"]');
    if (!region) { // a region made now speaks from its next change: wait for that
      region = document.body.appendChild(document.createElement("div"));
      region.className = "toasts";
      region.setAttribute("role", "status");
      return void setTimeout(next, 150);
    }
    now = queue.shift();
    var el = (t.el = document.createElement("div"));
    el.className = "toast";
    el.innerHTML = '<span class="ic toast__icon" aria-hidden="true"></span><p class="toast__text"></p><div class="toast__actions"></div>';
    el.firstChild.classList.add(o.failed ? "ic--warning" : "ic--check");
    el.children[1].textContent = o.text;
    var acts = el.lastChild;
    if (o.action) acts.appendChild(button("toast__action", o.action, function () { if (o.onAction) o.onAction(); close(t); }));
    var x = acts.appendChild(button("btn--quiet btn--icon", "", function () { close(t); }));
    x.setAttribute("aria-label", "Dismiss");
    x.innerHTML = '<span class="ic ic--close" aria-hidden="true"></span>';
    acts.firstChild.setAttribute("aria-keyshortcuts", "Alt+T");
    el.addEventListener("pointerenter", function () { t.hover = true; hold(t); });
    el.addEventListener("pointerleave", function () { t.hover = false; run(t); });
    el.addEventListener("focusin", function (e) {
      if (!t.focus && !el.contains(e.relatedTarget)) t.back = e.relatedTarget;
      t.focus = true;
      hold(t);
    });
    el.addEventListener("focusout", function (e) {
      if (!el.contains(e.relatedTarget)) { t.focus = false; run(t); }
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(t); }
    });
    region.appendChild(el); // the one change the region announces
    pad(region);
    if (ro) ro.observe(region);
    run(t);
  }

  NS.toast = function (opts) { // { text, action, onAction, failed, region, duration }
    var t = { opts: opts, left: Math.max(opts.action ? 10000 : 6000, opts.duration || 0) };
    queue.push(t);
    next();
    return { dismiss: function () { close(t); } };
  };

  document.addEventListener("visibilitychange", function () {
    if (now) (document.hidden ? hold : run)(now);
  });
  document.addEventListener("keydown", function (e) { // Alt+T, by the key's place or its label
    if (!now || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.code !== "KeyT" && e.key !== "t") return;
    // in a field where it types a character (a Mac's ⌥T is †), let it type
    if (e.key.toLowerCase() !== "t" && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    var b = now.el.querySelector("button");
    b.focus();
    if (document.activeElement === b) e.preventDefault(); // behind a modal it can't: leave the key be
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-toast]"), frame = b && b.closest(".frame");
    if (b) NS.toast({
      text: b.getAttribute("data-toast"),
      action: b.getAttribute("data-toast-action"),
      failed: b.hasAttribute("data-toast-failed"),
      region: frame && frame.querySelector(':scope > .toasts[role="status"]'),
      onAction: function () { b.dispatchEvent(new CustomEvent("toastaction", { bubbles: true })); }
    });
  });
  document.querySelectorAll("[data-toast][hidden]").forEach(function (b) { b.hidden = false; });
})();
