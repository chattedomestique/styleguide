/* ==========================================================================
   SG.media: loading and failed states for .media figures
   --------------------------------------------------------------------------
   An <img> has no attribute that says "still loading" or "gave up", so the state lives on the
   figure as data-state="loading" | "failed" (see media.css). This script sets it from the image's
   own load and error events, and nothing else. Without it the picture simply appears.

     <figure class="media"> <div class="media__frame"><img src="…" alt="…"></div> … </figure>

   · loading   an <img> that is not complete yet (also lazy ones far off screen): skeleton + spinner,
               aria-busy on the figure
   · failed    the error event: the picture hides; an icon, a sentence and "Try again" appear; the
               sentence is announced politely (SG.announce) because nothing moved focus
   · retry     a button with data-media-retry re-requests the image; if it had focus, focus moves to
               the frame so keyboard users are not dropped at the top of the page

   Words can be changed per figure: data-loading-text, data-failed-text, data-retry-text.
   A figure that already carries its own .media__status (an authored example) keeps it untouched.
   Hooks are delegated on document, so figures added later work without re-init. `load` and `error`
   do not bubble, so they are caught in the capture phase.

     SG.media.watch(img)   look at an <img> again after you changed its src from script
     SG.media.init(root)   scan a subtree
   ========================================================================== */
(function (SG) {
  'use strict';

  var TEXT = { loading: 'Loading image', failed: 'Image didn’t load', retry: 'Try again' };

  function figureOf(el) { return el && el.closest ? el.closest('.media') : null; }
  function frameOf(fig) { return fig.querySelector('.media__frame'); }
  function primary(fig) { return fig.querySelector('.media__frame img'); }
  function words(fig, kind) { return fig.getAttribute('data-' + kind + '-text') || TEXT[kind]; }

  /** Fill the status element (made here, or already ours). Authored ones are never touched. */
  function paint(fig, state) {
    var s = fig.querySelector('.media__status');
    if (s && !s.hasAttribute('data-sg-made')) return;
    if (!s) {
      var frame = frameOf(fig);
      if (!frame) return;
      s = document.createElement('div');
      s.className = 'media__status';
      s.setAttribute('data-sg-made', '');
      frame.appendChild(s);
    }
    s.textContent = '';
    if (state === 'failed') {
      var ic = document.createElement('span');
      ic.className = 'ic ic--image';
      ic.setAttribute('aria-hidden', 'true');
      s.appendChild(ic);
    }
    var note = document.createElement('p');
    note.className = 'media__note';
    note.textContent = words(fig, state);
    s.appendChild(note);
    if (state === 'failed') {
      var b = document.createElement('button');
      b.className = 'btn';
      b.type = 'button';
      b.setAttribute('data-size', 'sm');
      b.setAttribute('data-media-retry', '');
      b.textContent = words(fig, 'retry');
      s.appendChild(b);
    }
  }

  function set(fig, state) {
    if (!state) {
      fig.removeAttribute('data-state');
      fig.removeAttribute('aria-busy');
      return;
    }
    if (fig.getAttribute('data-state') === state) return;
    fig.setAttribute('data-state', state);
    if (state === 'loading') fig.setAttribute('aria-busy', 'true'); else fig.removeAttribute('aria-busy');
    paint(fig, state);
    if (state === 'failed') SG.announce(words(fig, 'failed'));
  }

  /** Look at an <img> (again): loading until it is complete, failed if it completed with no pixels. */
  function watch(img) {
    var fig = figureOf(img);
    if (!fig || img !== primary(fig)) return;
    if (!img.complete) set(fig, 'loading');
    else if (img.naturalWidth === 0 && img.getAttribute('src')) set(fig, 'failed');
    else set(fig, null);
  }

  function retry(fig) {
    var img = fig && primary(fig);
    var src = img && img.getAttribute('src');
    if (!src) return;
    set(fig, 'loading');
    img.removeAttribute('src');
    // a frame later, or the browser treats it as the same failed request
    window.requestAnimationFrame(function () { img.setAttribute('src', src); });
  }

  document.addEventListener('load', function (e) {
    var fig = figureOf(e.target);
    if (fig && e.target === primary(fig)) set(fig, null);
  }, true);

  document.addEventListener('error', function (e) {
    var fig = figureOf(e.target);
    if (fig && e.target === primary(fig)) set(fig, 'failed');
  }, true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-media-retry]');
    var fig = b && figureOf(b);
    if (!fig) return;
    var hadFocus = document.activeElement === b;
    retry(fig);
    var frame = frameOf(fig);
    if (hadFocus && frame) {
      frame.setAttribute('tabindex', '-1');
      frame.focus({ preventScroll: true });
    }
    SG.announce(words(fig, 'loading'));
  });

  function init(root) {
    SG.qsa('.media', root).forEach(function (fig) {
      var img = primary(fig);
      // authored states (docs examples, server-rendered errors) are left as they are
      if (img && !fig.hasAttribute('data-state')) watch(img);
    });
  }

  SG.media = { watch: watch, retry: retry, init: init };
  SG.ready(function () { init(document); });
})((window.SG = window.SG || {}));
