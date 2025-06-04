/*
 * card.js
 */

document.addEventListener("DOMContentLoaded", () => {
  fetch("/components/card.html")
    .then(res => res.text())
    .then(html => {
      const div = document.createElement("div");
      div.innerHTML = html;
      document.body.appendChild(div);

      class ProjectCard extends HTMLElement {
        connectedCallback() {
          const href = this.getAttribute("href");
          const title = this.getAttribute("title");
          const desc = this.getAttribute("desc");
          const img = this.getAttribute("image");
          const alt = this.getAttribute("alt");

          const template = document.getElementById("card-template").content.cloneNode(true);
          const a = template.querySelector("a");

          a.href = href;
          a.setAttribute("onmouseover", `animationSetTitle('${title}', '${title}');`);
          a.setAttribute("onmouseout", "animationClearTitle();");

          template.querySelector("img").src = img;
          template.querySelector("img").alt = alt;
          template.querySelector("h2").textContent = title;
          template.querySelector("p").innerHTML = desc;

          this.appendChild(template);
        }
      }

      if (!customElements.get("project-card")) {
        customElements.define("project-card", ProjectCard);
      }
    });
});
