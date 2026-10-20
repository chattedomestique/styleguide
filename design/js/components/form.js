/* ==========================================================================
   Form — errors on submit. Spec: elements/form.md

   Without this file the browser's own validation runs. With it, the browser
   still decides what is wrong (required, pattern, type), but instead of its
   bubble each field shows Field's error, and the summary at the top lists
   them as links and takes focus. A field shown wrong is checked again on
   blur, or on change for a choice: never while typing.
   ========================================================================== */
(function () {
  "use strict";
  // a control's box is its .field, or a group's fieldset: it holds one .field__error
  function box(el) { return el.closest ? el.closest("fieldset, .field") : null; }
  function errorOf(el) { var b = box(el); return b && b.querySelector(".field__error"); }
  function mark(el) { // show or clear one control's error; returns it if shown
    var err = errorOf(el), bad = !el.validity.valid;
    if (!err) return null;
    var owner = box(el).localName === "fieldset" ? box(el) : el; // a group is described as one
    var ids = (owner.getAttribute("aria-describedby") || "").split(/\s+/)
      .filter(function (id) { return id && id !== err.id; });
    if (bad) ids.unshift(err.id); // the fix first, then the help
    if (ids.length) owner.setAttribute("aria-describedby", ids.join(" "));
    else owner.removeAttribute("aria-describedby");
    if (owner === el && bad) el.setAttribute("aria-invalid", "true");
    else if (owner === el) el.removeAttribute("aria-invalid");
    err.hidden = !bad;
    return bad ? err : null;
  }
  document.querySelectorAll("form.form").forEach(function (form) {
    var summary = form.querySelector(".form__summary"), queued = 0;
    form.addEventListener("invalid", function (e) { // no bubble: ours, once all are checked
      e.preventDefault();
      if (!queued) queued = setTimeout(report);
    }, true);
    function report() {
      var wrong = [], seen = {};
      queued = 0;
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.willValidate || (el.type === "radio" && seen[el.name])) return;
        seen[el.name] = true;
        var err = mark(el);
        if (err) wrong.push({ el: el, text: err.textContent.trim() });
      });
      if (!wrong.length) return;
      if (!summary) return wrong[0].el.focus(); // one field: its error is in view
      var list = summary.querySelector("ul");
      list.textContent = "";
      wrong.forEach(function (w) {
        var li = list.appendChild(document.createElement("li"));
        var a = li.appendChild(document.createElement("a"));
        a.href = "#" + w.el.id;
        a.textContent = w.text;
      });
      summary.querySelector(".card__title").textContent =
        wrong.length === 1 ? "Fix 1 thing" : "Fix " + wrong.length + " things";
      summary.hidden = false;
      summary.focus();
    }
    function recheck(e) {
      var err = errorOf(e.target);
      if (err && !err.hidden && e.target.willValidate) mark(e.target);
    }
    form.addEventListener("focusout", recheck);
    form.addEventListener("change", recheck);
    if (summary) summary.addEventListener("click", function (e) { // caret in, label in view
      var a = e.target.closest("a[href^='#']");
      var el = a && document.getElementById(a.getAttribute("href").slice(1));
      if (!el) return;
      e.preventDefault();
      (box(el).querySelector("legend, label") || el).scrollIntoView({ block: "start" });
      el.focus({ preventScroll: true });
    });
  });
})();
