/* ==========================================================================
   app.js — the starter's own code, the part you replace with your app.
   It keeps a list of decks on this device (localStorage, a tiny JSON) so the
   platform patterns have something real to work on: make a deck, export it
   to a file, import it back. The platform itself is pwa.js, in
   dist/flashcards.js; this only calls it (Flashcards.download, readJSON,
   persist, toast).
   ========================================================================== */
(function () {
  "use strict";
  var F = window.Flashcards || {};
  var KEY = "flashcards";
  var data = load();

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && Array.isArray(d.decks)) return d;
    } catch (e) { /* nothing saved yet, or no storage */ }
    return { app: "flashcards", version: 1, decks: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode: kept for this visit */ }
  }
  function $(id) { return document.getElementById(id); }
  function count(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
  function say(text) { if (F.toast) F.toast({ text: text }); }

  /* Today: the empty state until there's a deck */
  var today = $("today-state");
  if (today && data.decks.length) {
    today.innerHTML = '<p class="t-body">Nothing is due today. Cards come back here on the day they\'re due.</p>' +
      '<div class="btn-row"><a class="btn" href="decks.html">Go to your decks</a></div>';
  }

  /* Decks: a plain list over the empty state's ghost card */
  var state = $("decks-state");
  function render() {
    if (!state || !data.decks.length) return;
    var list = $("decks-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "list";
      list.id = "decks-list";
      list.innerHTML = '<ul class="list__rows" role="list"></ul>';
      state.parentNode.insertBefore(list, state);
    }
    var rows = list.firstChild;
    rows.textContent = "";
    data.decks.forEach(function (d) {
      var li = rows.appendChild(document.createElement("li"));
      li.innerHTML = '<div class="list__row"><span class="list__main"><span class="list__title"></span><span class="list__meta"></span></span></div>';
      li.querySelector(".list__title").textContent = d.name;
      li.querySelector(".list__meta").textContent = d.cards ? count(d.cards, "card") : "No cards yet";
    });
    state.querySelector(".t-body").textContent = count(data.decks.length, "deck") + " on this device.";
    state.querySelector(".card__title").textContent = "Make another deck";
  }
  render();

  var sheet = $("decks-new");
  if (sheet) {
    sheet.addEventListener("close", function () {
      var field = $("decks-new-name"), name = field.value.trim();
      if (sheet.returnValue === "make" && name) {
        data.decks.push({ name: name, cards: 0 });
        save();
        render();
        say(name + " is saved on this device.");
        if (F.persist) F.persist(); // real use now: ask to keep storage through cleanup
      }
      sheet.returnValue = "";
      field.form.reset(); // and Form's error with it, so the next deck starts clean
      $("decks-new-name-error").hidden = true;
      field.removeAttribute("aria-invalid");
      field.setAttribute("aria-describedby", "decks-new-name-help");
    });
    // Today's "Make your first deck" comes here to open it
    if (location.hash === "#new") {
      history.replaceState(null, "", location.pathname);
      sheet.showModal();
    }
  }

  /* Settings: export and import the decks as a JSON file */
  var exp = $("settings-export"), imp = $("settings-import"), file = $("settings-import-file");
  if (exp && F.download) {
    exp.addEventListener("click", function () {
      F.download("flashcards-" + new Date().toISOString().slice(0, 10) + ".json", data);
      say("Exported " + count(data.decks.length, "deck") + ".");
    });
  }
  if (imp && F.readJSON) {
    imp.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      var chosen = file.files[0];
      file.value = ""; // so the same file can be chosen again
      if (!chosen) return;
      F.readJSON(chosen).then(function (d) {
        if (!d || d.app !== "flashcards" || !Array.isArray(d.decks)) throw new Error("not a deck export");
        var have = data.decks.map(function (x) { return x.name; }), added = 0;
        d.decks.forEach(function (x) {
          if (x && typeof x.name === "string" && x.name.trim() && have.indexOf(x.name) < 0) {
            data.decks.push({ name: x.name.trim(), cards: Math.max(0, parseInt(x.cards, 10) || 0) });
            have.push(x.name);
            added++;
          }
        });
        save();
        say(added ? "Added " + count(added, "deck") + " from the file." : "Every deck in that file is already here.");
        if (added && F.persist) F.persist();
      }).catch(function () { $("settings-import-failed").showModal(); });
    });
  }
  if (exp && F.download && F.readJSON) $("settings-data-foot").hidden = false; // both work: show them

  /* the reminder card's Not now: gone for this visit; focus stays on the screen */
  var later = $("settings-notify-later");
  if (later) {
    later.addEventListener("click", function () {
      later.closest("[data-pwa]").hidden = true;
      $("settings-main").focus();
    });
  }
})();
