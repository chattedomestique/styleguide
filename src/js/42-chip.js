/* ==========================================================================
   Chips  (filter toggles, removable input chips, "+N" disclosure)
   --------------------------------------------------------------------------
   Markup and look are in src/components/chip.css. Everything here is opt-in per
   row: put data-sg-chips on the .chips container (or any ancestor). An app that
   handles its own clicks simply leaves the attribute off.

   FILTER CHIPS   <button class="chip" aria-pressed="false">
     click / Enter / Space flips aria-pressed.   Event  sg:chip-toggle  detail { chip, pressed }
   (Choice chips are native radios and need no script.)

   INPUT CHIPS    <li class="chip" data-kind="input"> … <button class="chip__remove" aria-label="Remove Anna">
     Activating the remove button (click, Enter, Space, or Delete / Backspace while it
     is focused) removes the chip and then:
       1. moves focus to the NEXT chip's remove button, else the PREVIOUS one, else
          the element named by data-empty-focus on the row, else the row itself
          (it gets tabindex="-1"; give it an aria-label so its name is announced);
       2. announces "Anna removed. 2 left." through SG.announce. Override the wording with
          data-removed-text="{label} removed, {count} remaining" on the row.
     Event  sg:chip-remove  detail { chip, label }   bubbles and is CANCELABLE: call
     preventDefault() to keep the chip (for example while a server call confirms), and
     remove it yourself later.

   "+N" DISCLOSURE  <button class="chip" data-kind="more" aria-expanded="false" aria-controls="ids">
     flips aria-expanded and the hidden attribute of every element named in aria-controls
     (a space-separated list) through SG.disclose (43-disclose.js). Focus stays on the button.

   SCROLLING ROW  (.chips.scroller, needs no data attribute)
     When a chip takes focus inside a horizontally scrolling row, the row scrolls so the whole
     chip shows, with a sliver of the next one. Browsers leave a partly visible chip where it
     is, which cuts its focus ring in half. Uses SG.revealInline (40-tabs.js), which honours
     SG.motion.reduced(). The chip that peeks in at the edge is the sign that the row goes on.
   ========================================================================== */
(function (SG) {
  'use strict';

  function rowOf(el) {
    return el.closest('[data-sg-chips]');
  }

  /* ---- filter toggle ---------------------------------------------------------------------- */
  function toggle(chip) {
    var on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    chip.dispatchEvent(new CustomEvent('sg:chip-toggle', { bubbles: true, detail: { chip: chip, pressed: on } }));
  }

  /* ---- "+N" disclosure: the generic one (43-disclose.js) does the work --------------------------- */
  function disclose(button) {
    return SG.disclose(button);
  }

  /* ---- input chip removal ---------------------------------------------------------------------- */
  function labelOf(chip, button) {
    var explicit = chip.getAttribute('data-label');
    if (explicit) return explicit;
    var el = chip.querySelector('.chip__label');
    if (el && el.textContent.trim()) return el.textContent.trim();
    var name = (button.getAttribute('aria-label') || '').replace(/^\s*remove\s+/i, '').trim();
    return name || chip.textContent.trim();
  }

  function removable(row) {
    return SG.qsa('.chip', row).filter(function (c) { return c.querySelector('.chip__remove'); });
  }

  function remove(button, row) {
    var chip = button.closest('.chip');
    if (!chip) return;
    var label = labelOf(chip, button);
    var ok = chip.dispatchEvent(new CustomEvent('sg:chip-remove', { bubbles: true, cancelable: true, detail: { chip: chip, label: label } }));
    if (!ok) return; // the app keeps the chip for now

    var chips = removable(row);
    var i = chips.indexOf(chip);
    var neighbour = chips[i + 1] || chips[i - 1] || null;
    var target = neighbour && neighbour.querySelector('.chip__remove');
    if (!target) {
      var sel = row.getAttribute('data-empty-focus');
      target = (sel && document.querySelector(sel)) || row;
      if (target === row && !row.hasAttribute('tabindex')) row.setAttribute('tabindex', '-1');
    }

    chip.remove();          // remove first: a focused element that disappears drops focus to <body>
    target.focus();

    var left = chips.length - 1;
    var template = row.getAttribute('data-removed-text');
    var message = template
      ? template.replace(/\{label\}/g, label).replace(/\{count\}/g, String(left))
      : label + ' removed. ' + (left ? left + ' left.' : 'None left.');
    SG.announce(message);
  }

  /* ---- wiring (delegated, so chips added later just work) ----------------------------------------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var rm = t.closest('.chip__remove');
    if (rm) {
      var r = rowOf(rm);
      if (r) remove(rm, r);
      return;
    }
    var chip = t.closest('.chip');
    if (!chip || !rowOf(chip)) return;
    if (chip.hasAttribute('aria-expanded') && chip.hasAttribute('aria-controls')) disclose(chip);
    else if (chip.hasAttribute('aria-pressed')) toggle(chip);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var rm = e.target.closest && e.target.closest('.chip__remove');
    var row = rm && rowOf(rm);
    if (!row) return;
    e.preventDefault();
    remove(rm, row);
  });

  document.addEventListener('focusin', function (e) {
    var t = e.target;
    var row = t && t.closest && t.closest('.chips.scroller');
    if (!row || !SG.revealInline) return;
    var item = t;
    while (item.parentElement && item.parentElement !== row) item = item.parentElement;
    if (item.parentElement === row) SG.revealInline(item, row, 24);
  });

  SG.chips = { toggle: toggle, disclose: disclose };
})((window.SG = window.SG || {}));
