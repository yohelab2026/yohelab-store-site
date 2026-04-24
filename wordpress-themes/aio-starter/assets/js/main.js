(function () {
  document.documentElement.classList.add("aio-js");

  // TOC smooth scroll (iOS Safari も含めてフォールバック対応)
  document.addEventListener("click", function (e) {
    var link = e.target.closest(".aio-toc a[href^='#']");
    if (!link) return;
    var id = link.getAttribute("href").slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // フォーカスをターゲット見出しに移動（アクセシビリティ）
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
})();
