/* ==========================================================================
   Disclosure: a button that shows and hides what it controls
   --------------------------------------------------------------------------
   The WAI-ARIA Authoring Practices "disclosure" pattern. Use it for a card panel
   that folds away, a "Show answer" button, an FAQ row: anything where one button
   opens one region and the region does not need its own focus management.

     <button class="card__ctl" type="button" aria-label="Decks"
             aria-expanded="true" aria-controls="decks-body" data-sg-toggle>
     <div id="decks-body">…</div>

   · The button keeps ONE name; aria-expanded tells a screen reader the state.
     Do not swap the label AND set aria-expanded: that announces the state twice.
   · The region is shown/hidden with the `hidden` attribute, so there is no
     animation to reduce and nothing to get out of step with the state.
   · data-sg-announce on the button reads the revealed text aloud politely (for
     an answer that appears somewhere the user is not looking). SG.announce is a
     live region, so nothing moves focus.
   · Start state comes from aria-expanded in the HTML; this script makes `hidden`
     agree with it on load, so the two can never disagree.
   Native <details>/<summary> does the same with no JS when the control can be
   the whole summary; prefer it when it fits.
   ========================================================================== */
(function (SG) {
  'use strict';

  function region(btn) {
    var id = btn.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  /** Open or close the region a toggle controls. Returns the new state. */
  SG.toggle = function (btn, open) {
    var target = region(btn);
    if (!target) return null;
    if (open === undefined) open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    target.hidden = !open;
    if (open && btn.hasAttribute('data-sg-announce') && SG.announce) SG.announce(target.textContent.replace(/\s+/g, ' ').trim());
    return open;
  };

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-sg-toggle]') : null;
    if (btn) SG.toggle(btn);
  });

  function sync() {
    var all = document.querySelectorAll('[data-sg-toggle][aria-controls]');
    for (var i = 0; i < all.length; i++) {
      var target = region(all[i]);
      if (target) target.hidden = all[i].getAttribute('aria-expanded') !== 'true';
    }
  }
  if (SG.ready) SG.ready(sync);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
  else sync();
})((window.SG = window.SG || {}));
