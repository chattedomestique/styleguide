/* ==========================================================================
   SG.player: transport controls for a native <audio> or <video>
   --------------------------------------------------------------------------
   Markup and the reasoning are in src/components/player.css. The media element
   plays; this script only drives the controls from its events and the media from
   the controls, and it runs after 70-scrubber.js because the seek bar is a Scrubber.

   PROGRESSIVE ENHANCEMENT. In the markup the media element has `controls` and the
   custom .player__controls are `hidden`. On load, for a .player whose media is
   usable, this script removes `controls`, unhides ours and starts listening. If the
   script never runs, the browser's own controls are all there is, and they work.

   WHAT IT DOES
     · play / pause button: aria-pressed = playing. The NAME never changes ("Play"):
       a toggle that renames itself and flips aria-pressed says the opposite of what
       it means (WAI-ARIA toggle button pattern). Buffering is written in .player__status
       after a beat; Play is never made inert (a busy Button ignores taps, and a stalled
       recording is when you want Pause).
     · [data-player="back"] / ["forward"]: jump data-skip seconds (default 10), clamped, announced.
     · [data-player="mute"]: toggles media.muted, aria-pressed = muted, name "Mute" constant.
     · [data-player="captions"]: shown only if the media has a <track kind="captions">; toggles it.
       (Native controls carry a captions menu; taking them off means bringing it back.)
     · seek bar (a .scrubber, data-format="time"): dragging, clicking or arrowing sets currentTime;
       playback moves the thumb (not while you are holding it).
     · time text [data-player="current"] / ["duration"].
     · one at a time: starting one player pauses the others.
     · clicking the picture of a video toggles play (a convenience; the button is the control).
     · failure: data-state="error", a plain sentence with an icon in .player__status, the controls
       become aria-disabled, and a "Try again" button ([data-player="retry"], made here if the markup
       has none) appears under the sentence. Try again reloads the media and gives the controls back;
       if it had focus, focus moves to Play (the button goes away). It never autoplays.
     · one row: SG.fit (05-fit.js) writes the richest layout that fits one line to data-fit on
       .player__row (full, compact, tight, bare: see player.css), and re-checks when the player's
       width or the reader's text size changes.
   API: SG.player.init(el)
   ========================================================================== */
(function (SG) {
  'use strict';

  var clock = (SG.scrubber && SG.scrubber.clock) || function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };

  function parts(root) {
    var c = root.querySelector('.player__controls');
    return {
      media: root.querySelector('.player__media'),
      controls: c,
      play: c && c.querySelector('.player__play'),
      mute: c && c.querySelector('[data-player="mute"]'),
      cc: c && c.querySelector('[data-player="captions"]'),
      scrub: c && c.querySelector('.scrubber'),
      seek: c && c.querySelector('input[type="range"]'),
      cur: c && c.querySelector('[data-player="current"]'),
      dur: c && c.querySelector('[data-player="duration"]'),
      status: c && c.querySelector('.player__status'),
      stage: root.querySelector('.player__stage'),
    };
  }

  function setPressed(el, on) { if (el) el.setAttribute('aria-pressed', String(!!on)); }
  function setDisabled(el, on) { if (!el) return; if (on) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled'); }
  function title(root) {
    var id = root.getAttribute('aria-labelledby');
    var el = id && document.getElementById(id);
    return el ? el.textContent.trim() : root.getAttribute('aria-label') || 'Recording';
  }

  /** Bring every readout in step with the media. dragging: the user is holding the thumb, so leave it alone. */
  function paint(root, dragging) {
    var p = parts(root);
    var m = p.media;
    var d = isFinite(m.duration) ? m.duration : 0;
    if (p.seek) {
      if (d) { p.seek.max = String(d); p.seek.disabled = false; }
      else if (m.readyState >= 1) p.seek.disabled = true; // metadata is in and there is no end (a stream): nothing to seek in
      if (!dragging) p.seek.value = String(m.currentTime || 0);
      if (SG.scrubber) SG.scrubber.sync(p.scrub);
    }
    if (p.cur) p.cur.textContent = clock(m.currentTime || 0);
    if (p.dur) p.dur.textContent = clock(d);
    setPressed(p.play, !m.paused && !m.ended);
    setPressed(p.mute, m.muted || m.volume === 0);
  }

  /** Captions and subtitles the media offers (the native button that lists them goes away with the native controls). */
  function captionTracks(m) {
    return Array.prototype.filter.call(m.textTracks || [], function (t) { return t.kind === 'captions' || t.kind === 'subtitles'; });
  }

  /** Every control the person can use to play, except the way out of a failure. */
  function playControls(p) {
    return [p.play, p.mute].concat(SG.qsa('.btn[data-player]', p.controls)).filter(function (b) { return b && b.getAttribute('data-player') !== 'retry'; });
  }

  function fail(root) {
    var p = parts(root);
    root.setAttribute('data-state', 'error');
    if (p.status) {
      // status = an icon and words, never colour alone; the words are their own box, so a second line hangs past the icon
      p.status.textContent = '';
      var ic = document.createElement('span');
      ic.className = 'ic ic--circle-alert';
      ic.setAttribute('aria-hidden', 'true');
      var words = document.createElement('span');
      words.textContent = 'This recording could not be played. Check your connection and try again.';
      p.status.appendChild(ic);
      p.status.appendChild(words);
      // the sentence says "try again", so there is a button that does it (outside the live region, so it is not read twice)
      if (!p.controls.querySelector('[data-player="retry"]')) {
        var b = document.createElement('button');
        b.className = 'btn';
        b.type = 'button';
        b.setAttribute('data-size', 'sm');
        b.setAttribute('data-player', 'retry');
        b.textContent = 'Try again';
        p.status.parentNode.insertBefore(b, p.status.nextSibling);
      }
    }
    playControls(p).forEach(function (b) { setDisabled(b, true); });
    if (p.seek) p.seek.disabled = true;
  }

  /** Try again: forget the failure, give the controls back and ask the browser for the media once more. */
  function retry(root) {
    var p = parts(root);
    root.removeAttribute('data-state');
    if (p.status) p.status.textContent = '';
    playControls(p).forEach(function (b) { setDisabled(b, false); });
    if (p.seek) p.seek.disabled = false;
    p.media.load(); // a new request; if it fails again the error event brings the sentence and the button back
    paint(root, false);
  }

  function init(root) {
    if (!root || root.hasAttribute('data-sg-ready')) return;
    var p = parts(root);
    if (!p.media || !p.controls || !p.play) return;
    root.setAttribute('data-sg-ready', '');
    // take the browser's controls off and show ours: from here the script is responsible for playing
    p.media.removeAttribute('controls');
    p.media.controls = false;
    p.controls.hidden = false;
    if (p.stage) p.stage.setAttribute('data-tap', '');
    var dragging = false;
    var skip = parseFloat(root.getAttribute('data-skip')) || 10;
    var m = p.media;

    ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'volumechange', 'play', 'pause', 'ended', 'emptied'].forEach(function (ev) {
      m.addEventListener(ev, function () { paint(root, dragging); });
    });
    // one recording at a time: paused as soon as we start, and again on the play event (a script or the
    // browser can start a player without going through our button)
    function pauseOthers() { SG.qsa('.player__media').forEach(function (other) { if (other !== m && !other.paused) other.pause(); }); }
    m.addEventListener('play', function () {
      pauseOthers();
      root.removeAttribute('data-state');
      if (p.status) p.status.textContent = '';
    });
    // Buffering is said in words, after a beat (a short stall is not news) and NEVER by making Play
    // inert: a busy Button ignores taps, and a stalled recording is exactly when you want Pause.
    var wait = 0;
    m.addEventListener('waiting', function () {
      clearTimeout(wait);
      wait = setTimeout(function () { if (!m.paused && p.status && !root.hasAttribute('data-state')) { root.setAttribute('data-state', 'buffering'); p.status.textContent = 'Buffering\u2026'; } }, 800);
    });
    ['playing', 'canplay', 'pause', 'ended', 'seeked'].forEach(function (ev) {
      m.addEventListener(ev, function () {
        clearTimeout(wait);
        if (root.getAttribute('data-state') === 'buffering') { root.removeAttribute('data-state'); if (p.status) p.status.textContent = ''; }
      });
    });
    m.addEventListener('ended', function () { SG.announce(title(root) + ' finished'); });
    m.addEventListener('error', function () { fail(root); });

    // the seek bar
    if (p.seek) {
      p.seek.addEventListener('input', function () {
        m.currentTime = Number(p.seek.value);
        if (p.cur) p.cur.textContent = clock(m.currentTime); // do not wait for the media's seeked event to show where you went
      });
      p.seek.addEventListener('pointerdown', function () { dragging = true; });
      var release = function () { dragging = false; paint(root, false); };
      p.seek.addEventListener('pointerup', release);
      p.seek.addEventListener('pointercancel', release);
      p.seek.addEventListener('blur', release);
    }

    // buttons (delegated on the controls, so the script never holds a reference that an app could replace)
    p.controls.addEventListener('click', function (e) {
      var b = e.target.closest('.btn');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      if (b.getAttribute('data-player') === 'retry') {
        var hadFocus = document.activeElement === b;
        retry(root);
        if (hadFocus) p.play.focus(); // the button hides with the failure: do not drop a keyboard user at the top of the page
        SG.announce('Trying ' + title(root) + ' again');
        return;
      }
      if (b === p.play) {
        if (m.paused || m.ended) {
          pauseOthers();
          var r = m.play();
          if (r && r.catch) r.catch(function (err) { if (err && err.name !== 'AbortError') fail(root); });
        } else m.pause();
        paint(root, false); // paused/muted change at once; the events that follow only confirm it
      } else if (b === p.mute) {
        m.muted = !m.muted;
        paint(root, false);
      } else if (b.getAttribute('data-player') === 'back' || b.getAttribute('data-player') === 'forward') {
        var dir = b.getAttribute('data-player') === 'back' ? -1 : 1;
        var d = isFinite(m.duration) ? m.duration : 0;
        m.currentTime = Math.min(d, Math.max(0, (m.currentTime || 0) + dir * skip));
        paint(root, false);
        SG.announce(clock(m.currentTime) + (d ? ' of ' + clock(d) : ''));
      }
    });

    // captions: the script takes the browser's controls off, so it must bring the captions switch back
    if (p.cc) {
      var tracks = captionTracks(m);
      if (tracks.length) {
        p.cc.hidden = false;
        tracks.forEach(function (t) { if (t.mode === 'disabled') t.mode = 'hidden'; }); // hidden = loaded, not drawn
        setPressed(p.cc, tracks.some(function (t) { return t.mode === 'showing'; }));
        p.cc.addEventListener('click', function () {
          var on = !tracks.some(function (t) { return t.mode === 'showing'; });
          tracks.forEach(function (t, i) { t.mode = on && i === 0 ? 'showing' : 'hidden'; });
          setPressed(p.cc, on);
          SG.announce(on ? 'Captions on' : 'Captions off');
        });
      }
    }

    // clicking the picture plays or pauses (pointer convenience; the play button is the real control)
    if (p.stage) p.stage.addEventListener('click', function () { p.play.click(); });

    paint(root, false);
    if (m.error) fail(root);
  }

  /* the row is one line at every size (see player.css, ONE ROW): the richest layout that fits */
  if (SG.fit) SG.fit.register('.player__row', { steps: ['full', 'compact', 'tight', 'bare'] });

  SG.player = { init: init };

  SG.afterParse(function () { SG.qsa('.player').forEach(init); });
})((window.SG = window.SG || {}));
