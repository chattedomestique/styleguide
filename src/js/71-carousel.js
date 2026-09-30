/* ==========================================================================
   SG.carousel: buttons, dots, counter and (opt-in) auto-advance for .carousel
   --------------------------------------------------------------------------
   The slides are a native scroll-snap track, so a finger, a trackpad, Shift+wheel and assistive
   scrolling work with no script at all. This adds the controls and keeps them truthful.
   Pattern: WAI-ARIA APG "Carousel" (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).

     <section class="carousel" aria-roledescription="carousel" aria-label="Field notes">
       <div class="carousel__track" id="notes-track" tabindex="0" role="group" aria-label="Slides">
         <div class="carousel__slide" role="group" aria-roledescription="slide" aria-label="1 of 6"> … </div>
       </div>
       <div class="carousel__bar">
         <p class="carousel__count"><span data-sg-current>1</span> of <span data-sg-total>6</span></p>
         <div class="carousel__dots" role="group" aria-label="Choose a slide">
           <button class="carousel__dot" type="button" aria-label="Slide 1" aria-current="true"></button> …
         </div>
         <div class="carousel__nav">
           <button class="btn carousel__play" …>  (only with data-autoplay)
           <button class="btn carousel__prev" …>  <button class="btn carousel__next" …>
   ---------------------------------------------------------------------------
   · the track       is a focusable, named group (tabindex="0"): a scroller nobody can focus is a scroller a
                     keyboard cannot reach (axe: scrollable-region-focusable). Left / Right arrows, Home and End
                     on it do what the buttons do, mirrored in right-to-left. The frame wears the focus ring.
   · current slide   read from the scroll position (so swipes and the buttons agree), written to
                     aria-current on the dots, the counter, and aria-disabled on prev / next at the ends
   · announcements   only for changes the person made with a control, through SG.announce ("Slide 3 of 6:
                     Tram on line 28"). Never during auto-advance: a moving slide show that talks is a trap.
   · dots            roving tabindex; arrows / Home / End move focus AND show that slide (like radios)
   · data-loop       prev on the first slide goes to the last, and back
   · data-autoplay="5000"   OFF until the person presses Play. Adds no behaviour without a .carousel__play
                     button (WCAG 2.2.2 needs a visible pause); never starts under reduced motion;
                     stops for good when focus enters the carousel or the track is touched; pauses while the
                     pointer rests on it or the tab is hidden. data-autoplay-start begins playing on load.
   · reduced motion  scrolling is instant (a position change is the safe kind of motion), never skipped
   ========================================================================== */
(function (SG) {
  'use strict';

  var state = new WeakMap();
  var LABEL = { start: 'Start slide show', stop: 'Pause slide show' };
  var HAS_SCROLLEND = 'onscrollend' in window;

  function parts(c) {
    return {
      track: c.querySelector('.carousel__track'),
      slides: SG.qsa('.carousel__slide', c),
      dots: SG.qsa('.carousel__dot', c),
      prev: c.querySelector('.carousel__prev'),
      next: c.querySelector('.carousel__next'),
      play: c.querySelector('.carousel__play'),
      cur: c.querySelector('[data-sg-current]'),
      tot: c.querySelector('[data-sg-total]'),
    };
  }

  function isRtl(el) { return getComputedStyle(el).direction === 'rtl'; }

  /** Which slide is at the start edge. Reads geometry, so it is right for swipes, buttons and resizes. */
  function currentIndex(p) {
    var t = p.track;
    if (!t || !p.slides.length) return 0;
    var pos = Math.abs(t.scrollLeft);
    if (pos <= 1) return 0;
    if (t.scrollWidth - t.clientWidth - pos <= 1) return p.slides.length - 1;
    var rtl = isRtl(t), tr = t.getBoundingClientRect(), best = 0, bestD = Infinity;
    p.slides.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs(rtl ? r.right - tr.right : r.left - tr.left);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  /** The words for a slide: "3 of 6: Tram on line 28". */
  function describe(slide) {
    var label = slide.getAttribute('aria-label') || '';
    var t = slide.querySelector('[data-title], .media__title, h2, h3, h4');
    var name = t ? t.textContent : (slide.querySelector('img[alt]') || {}).alt;
    name = name && name.replace(/\s+/g, ' ').trim();
    return 'Slide ' + label + (name ? ': ' + name : '');
  }

  function label(c, p) {
    // every slide is named "n of N" (APG); authored labels are kept when they already say so
    p.slides.forEach(function (s, i) {
      if (!s.hasAttribute('role')) s.setAttribute('role', 'group');
      if (!s.hasAttribute('aria-roledescription')) s.setAttribute('aria-roledescription', 'slide');
      var want = (i + 1) + ' of ' + p.slides.length;
      if (!s.getAttribute('aria-label') || /^\d+ of \d+$/.test(s.getAttribute('aria-label'))) s.setAttribute('aria-label', want);
    });
    if (p.tot) p.tot.textContent = String(p.slides.length);
  }

  function sync(c, i) {
    var p = parts(c), st = state.get(c), n = p.slides.length, loop = c.hasAttribute('data-loop');
    st.index = i;
    c.setAttribute('data-index', String(i));
    p.dots.forEach(function (d, k) {
      if (k === i) { d.setAttribute('aria-current', 'true'); d.tabIndex = 0; }
      else { d.removeAttribute('aria-current'); d.tabIndex = -1; }
    });
    if (p.cur) p.cur.textContent = String(i + 1);
    function gate(btn, off) {
      if (!btn) return;
      if (off) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    }
    gate(p.prev, !loop && i <= 0);
    gate(p.next, !loop && i >= n - 1);
  }

  /** Move to slide i. `say` announces it: pass it for anything the person did, never for auto-advance. */
  function go(c, i, say) {
    var p = parts(c), st = state.get(c), n = p.slides.length;
    if (!n || !p.track) return;
    if (i < 0) i = c.hasAttribute('data-loop') ? n - 1 : 0;
    if (i > n - 1) i = c.hasAttribute('data-loop') || st.autoWrap ? 0 : n - 1;
    var changed = i !== st.index;
    var t = p.track, rtl = isRtl(t);
    var tr = t.getBoundingClientRect(), sr = p.slides[i].getBoundingClientRect(), cs = getComputedStyle(t);
    var pad = parseFloat(rtl ? cs.scrollPaddingRight : cs.scrollPaddingLeft) || 0;
    var delta = rtl ? sr.right - tr.right + pad : sr.left - tr.left - pad;
    st.lock = true; // ignore the scroll events of our own scroll until it settles
    // An absolute scrollTo, not scrollBy: a relative scroll is treated as "one step" and, with
    // scroll-snap-stop: always, stops at the first snap point it passes, so a jump of three slides would land on one.
    t.scrollTo({ left: t.scrollLeft + delta, behavior: SG.motion.reduced() ? 'auto' : 'smooth' });
    sync(c, i);
    settle(c);
    if (say && changed) SG.announce(describe(p.slides[i]));
  }

  /** Release the lock when our own scroll has stopped: `scrollend` where it exists, a quiet period elsewhere. */
  function settle(c) {
    var st = state.get(c);
    clearTimeout(st.settleTimer);
    st.settleTimer = setTimeout(function () { release(c); }, HAS_SCROLLEND ? 1500 : 200);
  }
  function release(c) {
    var st = state.get(c);
    if (!st.lock) return;
    st.lock = false;
    clearTimeout(st.settleTimer);
    sync(c, currentIndex(parts(c)));
  }

  /* ---- auto-advance: opt-in, always stoppable -------------------------------------------- */
  function setPlaying(c, on, say) {
    var p = parts(c), st = state.get(c);
    if (!p.play) return;
    if (on && SG.motion.reduced()) on = false;
    st.playing = on;
    clearInterval(st.timer);
    if (on) {
      var ms = parseInt(c.getAttribute('data-autoplay'), 10) || 5000;
      st.timer = setInterval(function () {
        if (st.hover || document.hidden || SG.motion.reduced()) { if (SG.motion.reduced()) setPlaying(c, false, false); return; }
        st.autoWrap = true;
        go(c, st.index + 1, false);
        st.autoWrap = false;
      }, ms);
    }
    p.play.setAttribute('data-playing', on ? 'true' : 'false');
    p.play.setAttribute('aria-label', on ? (p.play.getAttribute('data-label-stop') || LABEL.stop) : (p.play.getAttribute('data-label-start') || LABEL.start));
    if (say) SG.announce(on ? 'Slide show started' : 'Slide show paused');
  }

  function bind(c) {
    if (state.has(c)) return;
    var p = parts(c);
    if (!p.track) return;
    state.set(c, { index: 0, lock: false, playing: false, hover: false });
    label(c, p);
    if (!p.track.hasAttribute('tabindex')) p.track.tabIndex = 0;
    if (!p.track.hasAttribute('role')) p.track.setAttribute('role', 'group');
    if (!p.track.hasAttribute('aria-label') && !p.track.hasAttribute('aria-labelledby')) p.track.setAttribute('aria-label', 'Slides');
    if (p.play) {
      // remember the authored words so a translated app keeps them
      if (!p.play.hasAttribute('data-label-start')) p.play.setAttribute('data-label-start', p.play.getAttribute('aria-label') || LABEL.start);
      setPlaying(c, false, false);
    } else if (c.hasAttribute('data-autoplay') && window.console) {
      console.warn('SG.carousel: data-autoplay needs a .carousel__play button (WCAG 2.2.2). Auto-advance is off.', c);
    }
    sync(c, currentIndex(p));
    if (p.play && c.hasAttribute('data-autoplay-start')) setPlaying(c, true, false);
  }

  function init(root) { SG.qsa('.carousel', root).forEach(bind); }

  /* ---- events, delegated --------------------------------------------------------------------- */
  function carouselOf(el) { return el && el.closest ? el.closest('.carousel') : null; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.carousel__prev, .carousel__next, .carousel__dot, .carousel__play');
    var c = t && carouselOf(t);
    if (!c) return;
    bind(c);
    var st = state.get(c), p = parts(c);
    if (t.classList.contains('carousel__play')) return setPlaying(c, !st.playing, true);
    if (t.classList.contains('carousel__prev')) go(c, st.index - 1, true);
    else if (t.classList.contains('carousel__next')) go(c, st.index + 1, true);
    else go(c, p.dots.indexOf(t), true);
  });

  document.addEventListener('keydown', function (e) {
    var tr = e.target.classList && e.target.classList.contains('carousel__track') ? e.target : null;
    var tc = tr && carouselOf(tr);
    if (tc && !e.altKey && !e.ctrlKey && !e.metaKey) {
      bind(tc);
      var ts = state.get(tc), n = parts(tc).slides.length, rtl = isRtl(tr), to = null;
      if (e.key === 'ArrowRight') to = ts.index + (rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') to = ts.index + (rtl ? 1 : -1);
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = n - 1;
      if (to !== null) { e.preventDefault(); go(tc, to, true); }
      return;
    }
    var d = e.target.closest && e.target.closest('.carousel__dot');
    var c = d && carouselOf(d);
    if (!c || e.altKey || e.ctrlKey || e.metaKey) return;
    var dots = parts(c).dots;
    var to = SG.roving(dots, d, e.key);
    if (!to) return;
    e.preventDefault();
    go(c, dots.indexOf(to), true);
  });

  // `scroll` does not bubble: capture it. A swipe or a scrollbar drag updates the controls as it moves.
  document.addEventListener('scroll', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('carousel__track')) return;
    var c = carouselOf(t);
    if (!c || !state.has(c)) return;
    var st = state.get(c);
    if (st.lock) return settle(c);
    if (st.raf) return;
    st.raf = requestAnimationFrame(function () {
      st.raf = 0;
      var i = currentIndex(parts(c));
      if (i !== st.index) sync(c, i);
    });
  }, true);

  document.addEventListener('scrollend', function (e) {
    var t = e.target;
    var c = t && t.classList && t.classList.contains('carousel__track') ? carouselOf(t) : null;
    if (c && state.has(c)) release(c);
  }, true);

  // stop for good when the person takes over: focus inside (except on the Play button itself) or a touch on the track
  document.addEventListener('focusin', function (e) {
    var c = carouselOf(e.target);
    if (!c || !state.has(c)) return;
    if (state.get(c).playing && !e.target.closest('.carousel__play')) setPlaying(c, false, false);
  });
  document.addEventListener('pointerdown', function (e) {
    var t = e.target.closest && e.target.closest('.carousel__track');
    var c = t && carouselOf(t);
    if (c && state.has(c) && state.get(c).playing) setPlaying(c, false, false);
  });
  // a resting pointer pauses (and resumes) without changing what the button says
  document.addEventListener('mouseover', function (e) { var c = carouselOf(e.target); if (c && state.has(c)) state.get(c).hover = true; });
  document.addEventListener('mouseout', function (e) {
    var c = carouselOf(e.target);
    if (c && state.has(c) && !c.contains(e.relatedTarget)) state.get(c).hover = false;
  });
  window.addEventListener('resize', function () {
    SG.qsa('.carousel').forEach(function (c) { if (state.has(c) && !state.get(c).lock) sync(c, currentIndex(parts(c))); });
  });

  SG.carousel = { init: init, go: function (c, i) { bind(c); go(c, i, false); }, play: function (c, on) { bind(c); setPlaying(c, !!on, false); } };
  SG.ready(function () { init(document); });
})((window.SG = window.SG || {}));
