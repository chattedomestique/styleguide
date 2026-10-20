/* ==========================================================================
   Tabs — sections of one screen. Spec: elements/tabs.md

   The markup is links to stacked sections, which is what you get without
   this. This makes ARIA tabs of it: the list becomes a tablist, each link a
   tab that controls its section, each section a tabpanel labelled by its
   tab. One tab stop (a roving tabindex); Left and Right move and select
   (automatic activation), wrapping at the ends and following the writing
   direction; Home and End go to the first and last. A click or a tap
   selects without jumping the page. A #hash naming a panel selects it.
   A .tabs carrying data-sg-static is left alone: the style sheet uses it to
   show the form without script.
   ========================================================================== */
(function () {
  "use strict";
  document.querySelectorAll(".tabs").forEach(function (box) {
    if (box.hasAttribute("data-sg-static")) return;
    var list = box.querySelector(".tabs__list");
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll(".tabs__tab"));
    var panels = tabs.map(function (tab) {
      var id = (tab.getAttribute("href") || "").replace(/^#/, "");
      return id ? document.getElementById(id) : null;
    });
    if (!tabs.length || panels.indexOf(null) !== -1) return;

    list.setAttribute("role", "tablist");
    tabs.forEach(function (tab, i) {
      var panel = panels[i];
      if (!tab.id) tab.id = panel.id + "-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
    });

    var current = -1;
    function select(i, focus) {
      tabs.forEach(function (tab, n) {
        var on = n === i;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
      });
      current = i;
      if (focus) tabs[i].focus();
    }

    function fromHash() {
      var id = location.hash.slice(1);
      for (var n = 0; n < panels.length; n++) if (id && panels[n].id === id) return n;
      return -1;
    }

    list.addEventListener("click", function (e) {
      var tab = e.target.closest(".tabs__tab");
      if (!tab || tabs.indexOf(tab) === -1) return;
      e.preventDefault();
      select(tabs.indexOf(tab), true);
    });

    list.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      var rtl = getComputedStyle(list).direction === "rtl";
      var next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
      var to = -1;
      if (next) to = (i + next + tabs.length) % tabs.length;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = tabs.length - 1;
      else if (e.key === " ") to = i; // a link ignores Space; a tab takes it
      else return;
      e.preventDefault();
      select(to, true);
    });

    window.addEventListener("hashchange", function () {
      var n = fromHash();
      if (n !== -1 && n !== current) select(n, false);
    });

    var start = fromHash();
    select(start === -1 ? 0 : start, false);
  });
})();
