/* ==========================================================================
   Disabled-but-focusable guard
   --------------------------------------------------------------------------
   Prefer aria-disabled="true" over the disabled attribute for controls a user
   may need to understand ("Why can't I press Save?"): it stays focusable and
   can be described with aria-describedby. But aria-disabled does nothing on its
   own: a keyboard user can still press Enter or Space. This guard makes it
   inert for clicks and keys, for every button, link and role=button, now and
   later. It is capture-phase so app handlers never see the event.
   ========================================================================== */
(function (SG) {
  'use strict';

  function disabledTarget(e) {
    var t = e.target;
    return t && t.closest ? t.closest('[aria-disabled="true"]') : null;
  }

  document.addEventListener('click', function (e) {
    if (disabledTarget(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && disabledTarget(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  SG.guard = true;
})((window.SG = window.SG || {}));
