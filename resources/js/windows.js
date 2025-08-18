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

      const winLayer = document.getElementById("win-layer") || (() => {
        const el = document.createElement("div");
        el.id = "win-layer";
        document.body.appendChild(el);
        return el;
      })();

      // breakpoints
      const MQS = [
        { name: "xs", mq: window.matchMedia("(max-width: 400px)") },
        { name: "sm", mq: window.matchMedia("(max-width: 600px)") },
        { name: "md", mq: window.matchMedia("(max-width: 900px)") }
      ];
      const getBP = () => (MQS.find(b => b.mq.matches)?.name || "lg");

      // utils
      const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
      let zTop = 5000;

      function syncLayerSize() {
        const H = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        winLayer.style.cssText = [
          "position:absolute",
          "top:0",
          "left:0",
          "width:100vw",
          `height:${H}px`,
          "z-index:9990",
          "pointer-events:none"
        ].join(";");
      }
      syncLayerSize();

      function bringToFront(win) {
        document.querySelectorAll(".win95-window").forEach(w => w.classList.remove("active"));
        win.style.zIndex = ++zTop;
        win.classList.add("active");
      }

      const isGlobal = win => win.parentElement === winLayer;

      function pageDims() {
        const de = document.documentElement;
        return { W: Math.max(de.scrollWidth, window.innerWidth), H: Math.max(de.scrollHeight, window.innerHeight) };
      }

      function keepInBounds(win, desktop) {
        const r = win.getBoundingClientRect();
        const cs = getComputedStyle(win);
        const left = parseFloat(cs.left) || 0;
        const top = parseFloat(cs.top) || 0;

        let W, H;
        if (isGlobal(win)) {
          const p = pageDims();
          W = p.W; H = p.H;
        } else {
          const d = (desktop || document.body).getBoundingClientRect();
          W = d.width; H = d.height;
        }

        const maxX = Math.max(W - r.width, 0);
        const maxY = Math.max(H - r.height, 0);
        win.style.left = clamp(left, 0, maxX) + "px";
        win.style.top = clamp(top, 0, maxY) + "px";
      }

      function layoutAll() {
        syncLayerSize();
        document.querySelectorAll(".win95-window").forEach(w => {
          const desktop = w.closest("#desktop");
          keepInBounds(w, desktop || document.body);
        });
      }

      function pickAttr(host, base) {
        const bp = getBP(); // xs/sm/md/lg
        const v = host.getAttribute(base + "-" + bp);
        return v != null ? v : host.getAttribute(base);
      }

      function applyInitialPos(host, win, desktop) {
        if (win.dataset.userMoved === "1") return;
        const leftAttr = pickAttr(host, "left");
        const topAttr = pickAttr(host, "top");
        if (leftAttr != null) win.style.left = parseInt(leftAttr, 10) + "px";
        if (topAttr != null) win.style.top = parseInt(topAttr, 10) + "px";
        keepInBounds(win, desktop);
      }

      // moving to global space
      function upgradeToGlobal(win) {
        if (isGlobal(win)) return;
        const r = win.getBoundingClientRect();
        const w = Math.round(r.width);

        winLayer.appendChild(win);
        win.classList.add("global");
        win.style.position = "absolute";
        win.style.left = Math.round(r.left + window.scrollX) + "px";
        win.style.top = Math.round(r.top + window.scrollY) + "px";
        win.style.width = w + "px";

        syncLayerSize();
        bringToFront(win);
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

          upgradeToGlobal(win);
          bringToFront(win);
          win.dataset.userMoved = "1";

          win.setPointerCapture?.(e.pointerId);
          win.classList.add("dragging");

          const r = win.getBoundingClientRect();
          if (isGlobal(win)) {
            const p = pageDims();
            limits = { minX: 0, minY: 0, maxX: p.W - r.width, maxY: p.H - r.height };
          } else {
            const d = desktop.getBoundingClientRect();
            limits = { minX: 0, minY: 0, maxX: d.width - r.width, maxY: d.height - r.height };
          }

          startX = e.clientX; startY = e.clientY;
          const cs = getComputedStyle(win);
          startLeft = parseFloat(cs.left) || 0;
          startTop = parseFloat(cs.top) || 0;

          window.addEventListener("pointermove", onPointerMove, { passive: false });
          window.addEventListener("pointerup", onPointerUp, { once: true });
          window.addEventListener("pointercancel", onPointerUp, { once: true });
          e.preventDefault();
        }

        function onPointerMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const nx = clamp(startLeft + dx, limits.minX, Math.max(limits.maxX, 0));
          const ny = clamp(startTop + dy, limits.minY, Math.max(limits.maxY, 0));
          win.style.left = Math.round(nx) + "px";
          win.style.top = Math.round(ny) + "px";
          e.preventDefault();
        }

        function onPointerUp(e) {
          window.removeEventListener("pointermove", onPointerMove);
          win.releasePointerCapture?.(e.pointerId);
          win.classList.remove("dragging");
          syncLayerSize();
        }

        handle.addEventListener("pointerdown", onPointerDown);
        win.addEventListener("pointerdown", ev => {
          if (!ev.target.closest(".close-btn")) bringToFront(win);
        });
      }

      function wireClose(win) {
        const btn = win.querySelector(".close-btn");
        if (!btn) return;
        const close = e => { e.stopPropagation(); win.style.display = "none"; syncLayerSize(); };
        btn.addEventListener("pointerdown", e => e.stopPropagation());
        btn.addEventListener("pointerup", close);
        btn.addEventListener("click", close);
      }

      class Win95Window extends HTMLElement {
        connectedCallback() {
          if (this._inited) return;
          this._inited = true;

          const title = this.getAttribute("title") || "";
          const leftDef = parseInt(this.getAttribute("left") || "20", 10);
          const topDef = parseInt(this.getAttribute("top") || "20", 10);

          const tpl = document.getElementById("win95-window-template");
          const node = tpl.content.cloneNode(true);
          const root = node.querySelector(".win95-window");
          const titleEl = node.querySelector(".title");
          const contentEl = node.querySelector(".window-content");

          titleEl.textContent = title;
          root.style.left = leftDef + "px";
          root.style.top = topDef + "px";

          const frag = document.createDocumentFragment();
          while (this.firstChild) frag.appendChild(this.firstChild);
          contentEl.appendChild(frag);
          this.appendChild(node);

          const desktop = this.closest("#desktop") || document.body;
          const win = this.querySelector(".win95-window");
          bringToFront(win);

          applyInitialPos(this, win, desktop);

          makeDraggable(win, desktop);
          wireClose(win);

          requestAnimationFrame(() => keepInBounds(win, desktop));
        }
      }

      if (!customElements.get("win95-window")) {
        customElements.define("win95-window", Win95Window);
      }

      // change breakpoint
      const onBPChange = () => {
        document.querySelectorAll("win95-window").forEach(host => {
          const win = host.querySelector(".win95-window");
          if (!win || win.dataset.userMoved === "1" || isGlobal(win)) return;
          applyInitialPos(host, win, host.closest("#desktop") || document.body);
        });
      };
      MQS.forEach(b => b.mq.addEventListener("change", onBPChange));

      const ro = new ResizeObserver(() => { syncLayerSize(); layoutAll(); });
      ro.observe(document.documentElement);

      const scheduleInitialLayout = () => {
        layoutAll();
        requestAnimationFrame(layoutAll);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutAll);
        window.addEventListener("load", () => { syncLayerSize(); layoutAll(); }, { once: true });
        setTimeout(() => { syncLayerSize(); layoutAll(); }, 120);
      };
      scheduleInitialLayout();

      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => { syncLayerSize(); layoutAll(); }, 80);
      });
    });
});
