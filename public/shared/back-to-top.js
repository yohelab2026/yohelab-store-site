// 全ページ共通: スクロールでトップに戻るボタン
(function () {
  if (typeof window === "undefined") return;
  if (document.getElementById("yh-back-to-top")) return;

  const btn = document.createElement("button");
  btn.id = "yh-back-to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "ページの先頭に戻る");
  btn.setAttribute("title", "ページの先頭に戻る");
  btn.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';

  const style = document.createElement("style");
  style.textContent = `
    #yh-back-to-top {
      position: fixed;
      right: 18px;
      bottom: 18px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #0b8f72 0%, #1fb6cf 100%);
      color: #fff;
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: 0 12px 28px rgba(11, 143, 114, .32);
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px) scale(.92);
      transition: opacity .25s ease, transform .25s ease, box-shadow .2s ease;
      z-index: 9998;
      -webkit-tap-highlight-color: transparent;
    }
    #yh-back-to-top.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    #yh-back-to-top:hover {
      filter: brightness(1.06);
      box-shadow: 0 16px 36px rgba(11, 143, 114, .42);
      transform: translateY(-2px) scale(1.04);
    }
    #yh-back-to-top:active {
      transform: translateY(0) scale(.96);
    }
    #yh-back-to-top:focus-visible {
      outline: 3px solid rgba(11, 143, 114, .35);
      outline-offset: 3px;
    }
    @media (max-width: 600px) {
      #yh-back-to-top {
        right: 14px;
        bottom: 14px;
        width: 44px;
        height: 44px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #yh-back-to-top {
        transition: opacity .2s ease;
        transform: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  function append() {
    document.body.appendChild(btn);
  }

  if (document.body) {
    append();
  } else {
    document.addEventListener("DOMContentLoaded", append, { once: true });
  }

  let ticking = false;
  function update() {
    const shouldShow = window.scrollY > 320;
    btn.classList.toggle("is-visible", shouldShow);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
})();
