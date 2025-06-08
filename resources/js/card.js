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

          const template = document.getElementById("project-card-template").content.cloneNode(true);
          const a = template.querySelector("a");

          a.href = href;
          a.setAttribute("onmouseover", `animationSetTitle('${title}', '${title}');`);
          a.setAttribute("onmouseout", "animationClearTitle();");

          template.querySelector("img").src = img;
          template.querySelector("img").alt = alt;
          template.querySelector(".title").textContent = title;
          template.querySelector(".description").innerHTML = desc;

          this.appendChild(template);
        }
      }

      class ArticleCard extends HTMLElement {
        connectedCallback() {
          const href = this.getAttribute("href");
          const title = this.getAttribute("title");
          const date = this.getAttribute("date");
          const datetime = this.getAttribute("datetime") || date;
          const desc = this.getAttribute("desc");
          const img = this.getAttribute("image");
          const alt = this.getAttribute("alt");
      
          const template = document.getElementById("article-card-template").content.cloneNode(true);
          const a = template.querySelector("a");
      
          a.href = href;
          a.setAttribute("onmouseover", `animationSetTitle('${title}', '${title}');`);
          a.setAttribute("onmouseout", "animationClearTitle();");
      
          template.querySelector("img").src = img;
          template.querySelector("img").alt = alt;
          template.querySelector(".title").textContent = title;
          template.querySelector(".date").textContent = date;
          template.querySelector(".date").setAttribute("datetime", datetime);
          template.querySelector(".description").innerHTML = desc;
      
          this.appendChild(template);
        }
      }   
      
      class BookCard extends HTMLElement {
        connectedCallback() {
          const title = this.getAttribute("title");
          const author = this.getAttribute("author");
          const review = this.getAttribute("review");
          const img = this.getAttribute("image");
          const alt = this.getAttribute("alt");
      
          const template = document.getElementById("book-card-template").content.cloneNode(true);
      
          template.querySelector("img").src = img;
          template.querySelector("img").alt = alt;
          template.querySelector(".title").textContent = title;
          template.querySelector(".author").textContent = author;
          template.querySelector(".review").innerHTML = review;
      
          this.appendChild(template);
        }
      }

      if (!customElements.get("project-card")) {
        customElements.define("project-card", ProjectCard);
      }
      if (!customElements.get("article-card")) {
        customElements.define("article-card", ArticleCard);
      }
      if (!customElements.get("book-card")) {
        customElements.define("book-card", BookCard);
      }

    });
});