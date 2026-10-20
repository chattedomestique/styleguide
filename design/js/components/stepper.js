/* ==========================================================================
   Stepper — the − and + buttons. Spec: elements/stepper.md

   The buttons ship hidden, so without this the value is a number field you
   type in. This shows them and steps the value within data-min, data-max
   and data-step, firing input and change. At a limit the button turns
   aria-disabled and stays focusable; a press there reads out why (its
   description, the help) instead of doing nothing. Up and Down step from
   inside the value. A status line reads each new value out.
   ========================================================================== */
(function () {
  "use strict";
  document.querySelectorAll(".stepper").forEach(function (box) {
    var input = box.querySelector(".stepper__input");
    var down = box.querySelector(".stepper__down");
    var up = box.querySelector(".stepper__up");
    if (!input || !down || !up) return;
    var min = Number(input.dataset.min || 0);
    var max = Number(input.dataset.max || Infinity);
    var step = Number(input.dataset.step || 1);
    var status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    box.appendChild(status);

    function current() {
      var v = parseInt(input.value, 10);
      return isNaN(v) ? null : v;
    }
    function sync() {
      var v = current();
      down.setAttribute("aria-disabled", String(v !== null && v <= min));
      up.setAttribute("aria-disabled", String(v !== null && v >= max));
    }
    function say(text) {
      // the same words twice running are still read out: vary them unseen
      status.textContent = status.textContent === text ? text + " " : text;
    }
    function move(dir, button) {
      if (button && button.getAttribute("aria-disabled") === "true") {
        var ids = (button.getAttribute("aria-describedby") || "").split(/\s+/);
        say(ids.map(function (id) {
          var el = id && document.getElementById(id);
          return el ? el.textContent.trim() : "";
        }).join(" ").trim());
        return;
      }
      var v = current();
      // a typed value between steps goes to the next step in that direction
      var n = v === null ? min
        : dir > 0 ? min + (Math.floor((v - min) / step) + 1) * step
        : min + (Math.ceil((v - min) / step) - 1) * step;
      n = Math.min(max, Math.max(min, n));
      if (n === v) return;
      input.value = String(n);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      say(input.value);
    }

    down.addEventListener("click", function () { move(-1, down); });
    up.addEventListener("click", function () { move(1, up); });
    input.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      move(e.key === "ArrowUp" ? 1 : -1);
    });
    input.addEventListener("input", sync);
    down.hidden = false;
    up.hidden = false;
    sync();
  });
})();
