/* ==========================================================================
   SG.filmstrip: mirror the chosen thumbnail into the stage
   --------------------------------------------------------------------------
   The thumbnails are native radio buttons, so the browser already does the hard part: one tab stop,
   arrow keys that move AND choose (wrapping), a form value. This script only makes the big picture
   follow the choice. Without it the strip still works as a radio group; the stage just stays put.

     <fieldset class="filmstrip__strip" aria-controls="trail-stage"> … </fieldset>
     <label class="filmstrip__thumb" [data-tone="3"]>   (a swatch: the label paints its own tone)
       <input type="radio" name="trail" data-full="harbour.svg" data-alt="Three boats under a low sun"
              data-title="Harbour at dawn" data-label="Mar 29" data-meta="Low sun, flat water.">
       <img src="harbour.svg" alt="Harbour at dawn">

   aria-controls on the strip names the stage (a .media figure). On change:
     data-full    the stage <img> src (and srcset is dropped); SG.media then shows its loading state
     data-alt     the stage <img> alt: describe the PICTURE here, the thumbnail's own alt names the CHOICE
     data-title / data-label / data-meta   fill .media__title / .media__label / .media__meta if present
     data-stage-tone   "1"…"6" | "ink" | "none": sets (or clears) data-tone on the stage, so a swatch choice
                  recolours the space behind a cut-out picture
   and the change is announced ("Showing Harbour at dawn, 2 of 6") because the picture that changed is
   not where focus is. Home / End jump to the first / last thumbnail (the browser gives the arrows).
   On load the track is scrolled, sideways only, so the chosen thumbnail is in view (to a snap point: see reveal).
   ========================================================================== */
(function (SG) {
  'use strict';

  function stripOf(el) { return el.closest ? el.closest('.filmstrip__strip') : null; }
  function radios(strip) { return SG.qsa('.filmstrip__thumb > input[type="radio"]', strip); }

  function setText(stage, cls, value) {
    var el = stage.querySelector('.' + cls);
    if (el && value != null) el.textContent = value;
  }

  function show(input) {
    var strip = stripOf(input);
    var stage = strip && document.getElementById(strip.getAttribute('aria-controls') || '');
    if (!stage) return;
    var thumb = input.closest('.filmstrip__thumb');
    var img = stage.querySelector('.media__frame img');
    var full = input.getAttribute('data-full');
    var alt = input.getAttribute('data-alt');

    if (img && full && img.getAttribute('src') !== full) {
      img.removeAttribute('srcset');
      img.setAttribute('src', full);
      if (SG.media) SG.media.watch(img);
    }
    if (img && alt != null) img.setAttribute('alt', alt);

    var tone = input.getAttribute('data-stage-tone');
    if (tone != null) {
      if (tone && tone !== 'none') stage.setAttribute('data-tone', tone); else stage.removeAttribute('data-tone');
    }

    var title = input.getAttribute('data-title');
    setText(stage, 'media__title', title);
    setText(stage, 'media__label', input.getAttribute('data-label'));
    setText(stage, 'media__meta', input.getAttribute('data-meta'));

    var all = radios(strip);
    var name = title || alt || (thumb && thumb.textContent.replace(/\s+/g, ' ').trim()) || '';
    SG.announce('Showing ' + name + ', ' + (all.indexOf(input) + 1) + ' of ' + all.length);
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('.filmstrip__thumb > input[type="radio"]') && t.checked) show(t);
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches('.filmstrip__thumb > input[type="radio"]')) return;
    if (e.key !== 'Home' && e.key !== 'End') return;
    var list = radios(stripOf(t)).filter(function (r) { return !r.disabled; });
    var to = e.key === 'Home' ? list[0] : list[list.length - 1];
    if (!to) return;
    e.preventDefault();
    to.checked = true;
    to.focus();
    to.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /** Scroll the track (sideways only, never the page) so the chosen thumbnail is fully in view. The track snaps
      to the start of a thumbnail (scroll-snap, proximity), and a position between two snap points is pulled back
      to the nearer one, which undid a plain "scroll by the overflow" and left the chosen swatch cut off at the
      edge. So it goes to a snap point: the first thumbnail start from which the chosen one is fully inside. */
  function reveal(track) {
    var on = track.querySelector('.filmstrip__thumb > input:checked');
    if (!on) return;
    var cs = getComputedStyle(track);
    var rtl = cs.direction === 'rtl';
    var tr = track.getBoundingClientRect();
    var scrolled = Math.abs(track.scrollLeft);
    // distance of an edge from the track's scroll origin, measured from the start side (left, or right in RTL)
    function fromStart(r, edge) { return (rtl ? tr.right - r[edge === 'start' ? 'right' : 'left'] : r[edge === 'start' ? 'left' : 'right'] - tr.left) + scrolled; }
    var padStart = parseFloat(rtl ? cs.scrollPaddingRight : cs.scrollPaddingLeft) || 0;
    var padEnd = parseFloat(rtl ? cs.paddingLeft : cs.paddingRight) || 0;
    var t = on.parentNode.getBoundingClientRect();
    var start = fromStart(t, 'start'), end = fromStart(t, 'end') + padEnd;
    if (start - padStart >= scrolled && end - scrolled <= track.clientWidth) return; // already in view
    var thumbs = SG.qsa('.filmstrip__thumb', track);
    for (var i = 0; i < thumbs.length; i++) {
      var snap = Math.max(0, fromStart(thumbs[i].getBoundingClientRect(), 'start') - padStart);
      if (end - snap <= track.clientWidth + 0.5) { track.scrollLeft = rtl ? -snap : snap; return; }
    }
  }

  SG.filmstrip = { show: show, reveal: reveal };
  SG.ready(function () { SG.qsa('.filmstrip__track').forEach(reveal); });
})((window.SG = window.SG || {}));
