/*
 * windows.js
 */

document.addEventListener("DOMContentLoaded", () => {
  fetch("/components/window.html")
    .then(r => r.text())
    .then(html => {
      const holder = document.createElement("div");
      holder.innerHTML = html;
      document.body.appendChild(holder);

      let zTop = 10;
      const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

      function bringToFront(win) {
        document.querySelectorAll(".win95-window").forEach(w => w.classList.remove("active"));
        win.style.zIndex = ++zTop;
        win.classList.add("active");
      }

      function keepInBounds(win, desktop) {
        const d = desktop.getBoundingClientRect();
        const r = win.getBoundingClientRect();
        const left = parseFloat(getComputedStyle(win).left) || 0;
        const top = parseFloat(getComputedStyle(win).top) || 0;
        const maxX = Math.max(d.width - r.width, 0);
        const maxY = Math.max(d.height - r.height, 0);
        win.style.left = clamp(left, 0, maxX) + "px";
        win.style.top = clamp(top, 0, maxY) + "px";
      }

      function makeDraggable(win, desktop) {
        const handle = win.querySelector(".title-bar");
        if (!handle) return;

        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;
        let limits = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        function onPointerDown(e) {
          if (e.target.closest(".close-btn")) return;
          if (e.button !== 0 && e.pointerType === "mouse") return;

          bringToFront(win);
          win.setPointerCapture?.(e.pointerId);
          win.classList.add("dragging");

          const d = desktop.getBoundingClientRect();
          const r = win.getBoundingClientRect();
          limits = { minX: 0, minY: 0, maxX: d.width - r.width, maxY: d.height - r.height };

          startX = e.clientX;
          startY = e.clientY;

          const cs = getComputedStyle(win);
          startLeft = parseFloat(cs.left) || 0;
          startTop = parseFloat(cs.top) || 0;

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp, { once: true });
          e.preventDefault();
        }

        function onPointerMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const nx = clamp(startLeft + dx, limits.minX, Math.max(limits.maxX, 0));
          const ny = clamp(startTop + dy, limits.minY, Math.max(limits.maxY, 0));
          win.style.left = Math.round(nx) + "px";
          win.style.top = Math.round(ny) + "px";
        }

        function onPointerUp(e) {
          window.removeEventListener("pointermove", onPointerMove);
          win.releasePointerCapture?.(e.pointerId);
          win.classList.remove("dragging");
        }

        win.addEventListener("mousedown", ev => { if (!ev.target.closest(".close-btn")) bringToFront(win); });
        win.addEventListener("touchstart", ev => { if (!ev.target.closest(".close-btn")) bringToFront(win); }, { passive: true });
        handle.addEventListener("pointerdown", onPointerDown);
      }

      function wireClose(win) {
        const btn = win.querySelector('.close-btn');
        if (!btn) return;

        btn.addEventListener('click', e => {
          e.stopPropagation();
          win.style.display = 'none';
        });

        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('mousedown', e => e.preventDefault());
        btn.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
      }


      class Win95Window extends HTMLElement {
        connectedCallback() {
          if (this._inited) return;
          this._inited = true;

          const title = this.getAttribute("title") || "";
          const left = parseInt(this.getAttribute("left") || "20", 10);
          const top = parseInt(this.getAttribute("top") || "20", 10);

          const tpl = document.getElementById("win95-window-template");
          const node = tpl.content.cloneNode(true);
          const root = node.querySelector(".win95-window");
          const titleEl = node.querySelector(".title");
          const contentEl = node.querySelector(".window-content");

          titleEl.textContent = title;
          root.style.left = left + "px";
          root.style.top = top + "px";

          const frag = document.createDocumentFragment();
          while (this.firstChild) frag.appendChild(this.firstChild);
          contentEl.appendChild(frag);

          this.appendChild(node);

          const desktop = this.closest("#desktop") || document.body;
          const win = this.querySelector(".win95-window");
          win.style.zIndex = ++zTop;

          makeDraggable(win, desktop);
          wireClose(win);
          keepInBounds(win, desktop);
        }
      }

      if (!customElements.get("win95-window")) {
        customElements.define("win95-window", Win95Window);
      }

      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          document.querySelectorAll(".win95-window").forEach(w => {
            const desktop = w.closest("#desktop") || document.body;
            keepInBounds(w, desktop);
          });
        }, 80);
      });
    });
});
