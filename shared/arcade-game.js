(() => {
  const cfg = window.YOHE_GAME;
  if (!cfg) return;

  const root = document.getElementById("gameRoot");
  const board = document.getElementById("board");
  const scoreEl = document.getElementById("statScore");
  const timeEl = document.getElementById("statTime");
  const bestEl = document.getElementById("statBest");
  const statusEl = document.getElementById("statusText");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const hintList = document.getElementById("hintList");
  const touchPad = document.getElementById("touchPad");

  const bestKey = `yohelab-game-best-${cfg.slug}`;
  const bestLow = cfg.lowerIsBetter; // for reaction: lower ms = better
  let bestRaw = Number(localStorage.getItem(bestKey) || 0);
  let best = bestRaw;
  let running = false;
  let ended = false;
  let score = 0;
  let timeLeft = cfg.timeLimit || 30;
  let state = {};
  let raf = 0;
  let last = 0;

  const W = () => board.clientWidth || 640;
  const H = () => board.clientHeight || 520;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
  const lanes = 3;
  const laneX = (lane) => ((lane + 0.5) / lanes) * W();

  function setStats() {
    scoreEl.textContent = cfg.scoreLabel ? cfg.scoreLabel.replace("{n}", score) : String(score);
    if (!cfg.hideTimer) {
      timeEl.textContent = `${Math.max(0, Math.ceil(timeLeft))}秒`;
    }
    if (bestLow) {
      bestEl.textContent = best > 0 ? `${best}ms` : "—";
    } else {
      bestEl.textContent = String(best);
    }
  }

  function setStatus(text) { statusEl.textContent = text; }

  function setHints(items) {
    hintList.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      hintList.appendChild(li);
    }
  }

  function clearBoard() {
    board.innerHTML = "";
    board.className = "arcade-board";
  }

  function finish(message, win = false) {
    running = false;
    ended = true;
    cancelAnimationFrame(raf);

    // Update best score
    if (!cfg.noBest) {
      if (bestLow) {
        if (best === 0 || score < best) {
          best = score;
          localStorage.setItem(bestKey, String(best));
        }
      } else {
        if (score > best) {
          best = score;
          localStorage.setItem(bestKey, String(best));
        }
      }
      setStats();
    }

    setStatus(message);
    if (win) board.insertAdjacentHTML("beforeend", `<div class="game-banner">CLEAR ✓</div>`);

    // Show X (Twitter) share button — always shown at game over
    if (touchPad) {
      const gameName = document.title.split("|")[0].trim() || "ブラウザゲーム";
      const fallback = `「${gameName}」スコア: ${score}点！ あなたも挑戦してみて👇 #よへラボ`;
      const rawText = cfg.shareText
        ? cfg.shareText.replace("{score}", score).replace("{result}", message)
        : fallback;
      const gameUrl = buildResultUrl(score, message, win);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(rawText + "\n" + gameUrl)}`;

      // Score display label
      const scoreLabel = bestLow
        ? `平均 ${score}ms`
        : cfg.scoreLabel
          ? cfg.scoreLabel.replace("{n}", score)
          : `スコア ${score}`;

      const wrap = document.createElement("div");
      wrap.className = "share-result-wrap";
      wrap.innerHTML = `
        <div class="share-result-score">
          <strong>${scoreLabel}</strong>
          ${message}
        </div>
        <a href="${tweetUrl}" target="_blank" rel="noreferrer noopener" class="btn-share">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
          結果をXにポスト
        </a>
      `;
      touchPad.appendChild(wrap);
    }

    // Reveal ad slot
    const adSlot = document.getElementById("adSlotGameover");
    if (adSlot) adSlot.style.display = "block";
  }

  function resetCommon() {
    clearBoard();
    score = 0;
    timeLeft = cfg.timeLimit || 30;
    running = false;
    ended = false;
    state = {};
    setStats();
    setStatus(cfg.startText || "スタートを押して開始");
    if (touchPad) touchPad.innerHTML = "";
    // Hide ad slot on reset
    const adSlot = document.getElementById("adSlotGameover");
    if (adSlot) adSlot.style.display = "none";
  }

  function buildResultUrl(finalScore, message, win) {
    const base = cfg.shareUrl || `${location.origin}/games/${cfg.slug}/`;
    const url = new URL(base, location.origin);
    url.searchParams.set("score", String(finalScore));
    url.searchParams.set("result", message);
    url.searchParams.set("clear", win ? "1" : "0");
    return url.toString();
  }

  function showSharedResult() {
    if (!touchPad || !location.search) return;
    const params = new URLSearchParams(location.search);
    const sharedScore = params.get("score");
    const sharedResult = params.get("result");
    if (!sharedScore && !sharedResult) return;
    const gameName = document.title.split("|")[0].trim() || "ブラウザゲーム";
    const wrap = document.createElement("div");
    wrap.className = "share-result-wrap";
    wrap.innerHTML = `
      <div class="share-result-score">
        <strong>${escapeHtml(gameName)} の結果</strong>
        ${sharedScore ? `スコア ${escapeHtml(sharedScore)}` : ""}
        ${sharedResult ? `<br>${escapeHtml(sharedResult)}` : ""}
      </div>
    `;
    touchPad.appendChild(wrap);
  }

  function startLoop(fn) {
    let last = performance.now();
    const tick = (now) => {
      if (!running) return;
      const dt = (now - last) / 1000;
      last = now;
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        setStats();
        fn(dt, true);
        return;
      }
      fn(dt, false);
      setStats();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function makeTouchButtons(left, right, action) {
    if (!touchPad) return;
    touchPad.innerHTML = "";
    const btn1 = document.createElement("button");
    btn1.className = "btn-arcade";
    btn1.textContent = left;
    btn1.addEventListener("click", action.left);
    const btn2 = document.createElement("button");
    btn2.className = "btn-arcade primary";
    btn2.textContent = right;
    btn2.addEventListener("click", action.right);
    touchPad.append(btn1, btn2);
  }

  function makeTapButton(label, fn) {
    if (!touchPad) return;
    const btn = document.createElement("button");
    btn.className = "btn-arcade primary";
    btn.textContent = label;
    btn.addEventListener("click", fn);
    touchPad.innerHTML = "";
    touchPad.appendChild(btn);
  }

  // ── DODGE / COLLECT ────────────────────────────────────────────────────
  function initDodge(kind) {
    clearBoard();
    board.insertAdjacentHTML("beforeend", `<div class="lane-wrap">${Array.from({ length: lanes }, (_, i) => `<div class="lane" style="left:${(i * 100) / lanes}%"></div>`).join("")}</div>`);
    const player = document.createElement("div");
    player.className = "player";
    board.appendChild(player);
    const playerLane = { value: 1 };
    const items = [];
    const spawnEvery = kind === "collect" ? 0.68 : 0.78;
    const target = kind === "collect" ? 18 : 30;
    state = { playerLane, items, spawnTimer: 0, spawnEvery, kind, target };

    const draw = () => {
      player.style.left = `${laneX(playerLane.value)}px`;
      player.style.top = `${H() - 58}px`;
      for (const item of items) {
        item.el.style.left = `${laneX(item.lane)}px`;
        item.el.style.top = `${item.y}px`;
      }
    };

    const spawn = () => {
      const lane = Math.floor(rand(0, lanes));
      const el = document.createElement("div");
      const isBomb = kind === "collect" && Math.random() < 0.28;
      el.className = isBomb ? "hazard" : kind === "collect" ? "collectible" : "hazard";
      el.textContent = isBomb ? "💣" : kind === "collect" ? "⭐" : "⛔";
      board.appendChild(el);
      items.push({ lane, y: -20, el, bomb: isBomb });
    };

    const move = (dir) => {
      if (!running || ended) return;
      playerLane.value = clamp(playerLane.value + dir, 0, lanes - 1);
      draw();
    };

    makeTouchButtons("← 左へ", "右へ →", { left: () => move(-1), right: () => move(1) });
    board.addEventListener("pointerdown", (e) => { if (!running) return; state.lastX = e.clientX; });
    board.addEventListener("pointerup", (e) => {
      if (!running || state.lastX == null) return;
      const dx = e.clientX - state.lastX;
      if (Math.abs(dx) > 24) move(dx > 0 ? 1 : -1);
      state.lastX = null;
    });
    window.addEventListener("keydown", (e) => {
      if (!running) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }, { passive: true });

    startLoop((dt, timeUp) => {
      state.spawnTimer += dt;
      if (state.spawnTimer >= state.spawnEvery) { state.spawnTimer = 0; spawn(); }
      const speed = kind === "collect" ? 240 : 270;
      const playerY = H() - 58;
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += speed * dt;
        if (item.y > H() + 40) { item.el.remove(); items.splice(i, 1); continue; }
        const hit = item.lane === playerLane.value && Math.abs(item.y - playerY) < 28;
        if (hit) {
          if (kind === "collect") {
            if (item.bomb) { finish("💥 爆弾に当たった"); return; }
            score += 1; item.el.remove(); items.splice(i, 1);
            if (score >= target) { finish("CLEAR! 目標まで集めた", true); return; }
          } else { finish("ぶつかった。もう一回"); return; }
        }
      }
      draw();
      if (timeUp) {
        if (kind === "collect" && score >= target) finish("CLEAR! 目標達成", true);
        else if (kind === "collect") finish("時間切れ。もう少しで届く");
        else finish("時間切れ。生存成功", true);
        return;
      }
      if (kind === "dodge") score = Math.floor((cfg.timeLimit || 30) - timeLeft);
      setStats();
      setStatus(kind === "collect" ? "星を拾って、爆弾だけ避ける" : "障害物をよけて生き残る");
    });
    draw();
  }

  // ── STACK TOWER ────────────────────────────────────────────────────────
  function initStack() {
    clearBoard();
    board.classList.add("stack-stage");
    board.innerHTML = `<div class="stack-base"></div>`;
    const stateStack = [];
    const mover = document.createElement("div");
    mover.className = "stack-mover";
    board.appendChild(mover);
    const goal = 8;
    let currentWidth = 220;
    let movingX = 0;
    let direction = 1;
    let speed = 210;
    let layers = 0;
    let dropping = false;
    let placed = [];
    state = { goal };

    function render() {
      placed.forEach((layer, i) => {
        layer.el.style.width = `${layer.width}px`;
        layer.el.style.left = `${layer.x}px`;
        layer.el.style.bottom = `${24 + (i + 1) * 24}px`;
      });
      mover.style.width = `${currentWidth}px`;
      mover.style.left = `${movingX}px`;
      mover.style.top = `${48 + layers * 24}px`;
    }

    function drop() {
      if (!running || dropping) return;
      dropping = true;
      const prev = placed.length ? placed[placed.length - 1] : { x: W() / 2, width: 220 };
      const centered = movingX + currentWidth / 2;
      const prevCenter = prev.x + prev.width / 2;
      const overlap = currentWidth - Math.abs(centered - prevCenter);
      if (overlap <= 30) { finish("ズレすぎた。もう一回"); return; }
      const newWidth = Math.max(80, overlap);
      const newX = clamp(centered - newWidth / 2, 28, W() - newWidth - 28);
      const layer = document.createElement("div");
      layer.className = "stack-layer";
      board.appendChild(layer);
      placed.push({ el: layer, x: newX, width: newWidth });
      layers += 1; score = layers; currentWidth = newWidth;
      movingX = rand(20, W() - currentWidth - 20); speed += 12;
      if (layers >= goal) { finish("CLEAR! タワー完成", true); return; }
      dropping = false;
    }

    const step = (dt, timeUp) => {
      if (timeUp) { finish("時間切れ。積み上げ途中"); return; }
      movingX += direction * speed * dt;
      if (movingX <= 20) { movingX = 20; direction = 1; }
      if (movingX >= W() - currentWidth - 20) { movingX = W() - currentWidth - 20; direction = -1; }
      render(); score = layers;
      setStatus("タイミングよくタップして積む");
    };

    makeTapButton("DROP", drop);
    window.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") drop(); });
    board.addEventListener("pointerdown", drop);
    startLoop(step); render();
  }

  // ── COLOR MATCH ────────────────────────────────────────────────────────
  function initColor() {
    clearBoard();
    const colors = [
      { name: "みどり", hex: "#0a765b" },
      { name: "あお", hex: "#1d4ed8" },
      { name: "みずいろ", hex: "#0ea5e9" },
      { name: "きいろ", hex: "#ca8a04" },
    ];
    let round = 0;
    let current = null;
    board.innerHTML = `<div style="padding:24px;"><div class="prompt-box" id="prompt"></div><div class="color-grid" id="choices"></div></div>`;
    const prompt = board.querySelector("#prompt");
    const choiceWrap = board.querySelector("#choices");

    const next = () => {
      current = pick(colors);
      const shuffled = shuffle(colors.slice());
      prompt.textContent = `この色はどれ？  ${current.name.toUpperCase()}`;
      choiceWrap.innerHTML = "";
      shuffled.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "color-choice";
        btn.textContent = c.name;
        btn.style.background = `linear-gradient(180deg, ${c.hex}18 0%, #fff 100%)`;
        btn.addEventListener("click", () => {
          if (!running) return;
          if (c.name === current.name) {
            round += 1; score = round; setStatus("正解。次へ");
            if (round >= 10) { finish("CLEAR! 10問クリア", true); return; }
            next();
          } else { setStatus("ちがう。もう1回"); }
          setStats();
        });
        choiceWrap.appendChild(btn);
      });
    };

    next();
    makeTapButton("次の色", () => next());
    startLoop((_, timeUp) => {
      if (timeUp) { finish(`時間切れ。${round}問`, round >= 6); return; }
      score = round; setStatus("色の名前とボタンを合わせる");
    });
  }

  // ── MEMORY (pairs) ────────────────────────────────────────────────────
  function initMemory() {
    clearBoard();
    const deck = shuffle(["🍀","🌙","🔥","💎","🍒","⚡","🎯","🧠","🍀","🌙","🔥","💎","🍒","⚡","🎯","🧠"]);
    const revealed = [];
    const matched = new Set();
    board.innerHTML = `<div style="padding:20px;"><div class="memory-grid" id="memGrid"></div></div>`;
    const grid = board.querySelector("#memGrid");
    let busy = false; let moves = 0; let pairs = 0;

    const render = () => {
      grid.innerHTML = "";
      deck.forEach((symbol, idx) => {
        const card = document.createElement("button");
        card.className = "memory-card";
        const open = revealed.includes(idx) || matched.has(idx);
        if (open) card.classList.add("flipped");
        if (matched.has(idx)) card.classList.add("matched");
        card.textContent = open ? symbol : "？";
        card.addEventListener("click", () => {
          if (!running || busy || revealed.includes(idx) || matched.has(idx)) return;
          revealed.push(idx); moves += 1; render();
          if (revealed.length === 2) {
            busy = true;
            const [a, b] = revealed;
            if (deck[a] === deck[b]) {
              matched.add(a); matched.add(b); pairs += 1; score = pairs;
              revealed.length = 0; busy = false; render();
              if (pairs >= 8) finish("CLEAR! 全ペア完成", true);
            } else {
              setTimeout(() => { revealed.length = 0; busy = false; render(); }, 650);
            }
          }
        });
        grid.appendChild(card);
      });
    };

    render();
    makeTapButton("シャッフル", () => { if (!running) return; finish("やり直し"); });
    startLoop((_, timeUp) => {
      if (timeUp) { finish(`時間切れ。${pairs}組`); return; }
      score = pairs; setStatus("同じ絵を2枚そろえる"); setStats();
    });
  }

  // ── ORBIT ─────────────────────────────────────────────────────────────
  function initOrbit() {
    clearBoard();
    board.classList.add("orbit-stage");
    board.innerHTML = `<div class="orbit-ring"></div><div class="orbit-center"></div>`;
    const ring = 150;
    let angle = 0; let hazards = []; let spawn = 0; let scoreSeconds = 0;
    const player = document.createElement("div");
    player.className = "orb"; board.appendChild(player);

    function drawOrb(el, a, r) {
      const cx = W() / 2; const cy = H() / 2;
      el.style.left = `${cx + Math.cos(a) * r}px`;
      el.style.top = `${cy + Math.sin(a) * r}px`;
    }

    function move(dir) { if (!running) return; angle += dir * 0.14; }

    makeTouchButtons("↺ 左回り", "右回り ↻", { left: () => move(-1), right: () => move(1) });
    window.addEventListener("keydown", (e) => {
      if (!running) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });

    const tick = (dt, timeUp) => {
      if (timeUp) { finish(`CLEAR! ${Math.floor(scoreSeconds)}秒生存`, true); return; }
      scoreSeconds = (cfg.timeLimit || 30) - timeLeft; score = Math.floor(scoreSeconds);
      spawn += dt;
      if (spawn > 1.1) {
        spawn = 0;
        const el = document.createElement("div");
        el.className = "orb"; el.style.background = "#ffddd6"; el.style.borderColor = "#ef4444";
        board.appendChild(el);
        hazards.push({ el, angle: rand(0, Math.PI * 2), speed: rand(0.7, 1.4) * (Math.random() < 0.5 ? -1 : 1) });
      }
      angle += dt * 0.7; drawOrb(player, angle, ring);
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i]; h.angle += h.speed * dt * 0.9; drawOrb(h.el, h.angle, ring);
        const diff = Math.abs(((h.angle - angle + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (diff < 0.23) { finish("当たった。もう一回"); return; }
      }
      setStatus("ぐるっと回って、赤い障害物を避ける");
    };
    startLoop(tick); drawOrb(player, angle, ring);
  }

  // ── TAP RUSH ──────────────────────────────────────────────────────────
  function initTap() {
    clearBoard();
    let hits = 0;
    const targets = [];
    const spawnTarget = () => {
      if (!running) return;
      const el = document.createElement("button");
      el.className = "target"; el.textContent = "✦";
      el.style.left = `${rand(36, W() - 36)}px`;
      el.style.top = `${rand(36, H() - 36)}px`;
      el.style.width = el.style.height = `${rand(42, 66)}px`;
      el.addEventListener("click", () => {
        if (!running) return;
        hits += 1; score = hits; el.remove(); targets.splice(targets.indexOf(el), 1);
        if (hits >= 20) finish("CLEAR! 20個たたけた", true);
      });
      board.appendChild(el); targets.push(el);
      setTimeout(() => { if (el.isConnected) el.remove(); }, 1300);
    };

    makeTapButton("ターゲットを出す", () => spawnTarget());
    startLoop((dt, timeUp) => {
      if (timeUp) { finish(`時間切れ。${hits}個`, hits >= 12); return; }
      if (Math.random() < 0.03) spawnTarget();
      setStatus("出た丸をひたすらタップ"); score = hits;
    });
  }

  // ── NUMBER ORDER ──────────────────────────────────────────────────────
  function initNumber() {
    clearBoard();
    const nums = shuffle(Array.from({ length: 12 }, (_, i) => i + 1));
    const order = { value: 1 };
    const grid = document.createElement("div");
    grid.className = "number-grid"; grid.style.padding = "20px"; board.appendChild(grid);

    const render = () => {
      grid.innerHTML = "";
      nums.forEach((n) => {
        const btn = document.createElement("button");
        btn.className = "number-tile"; btn.textContent = n;
        btn.addEventListener("click", () => {
          if (!running) return;
          if (n === order.value) {
            order.value += 1; score = order.value - 1;
            btn.style.opacity = "0.35"; btn.disabled = true;
            if (order.value > 12) { finish("CLEAR! 数字を全部押せた", true); return; }
            setStatus(`次は ${order.value}`);
          } else {
            btn.animate([{transform:"translateX(0)"},{transform:"translateX(-4px)"},{transform:"translateX(4px)"},{transform:"translateX(0)"}], {duration:180});
          }
        });
        grid.appendChild(btn);
      });
    };
    render();
    makeTapButton("並び替え", () => { if (!running) return; finish("やり直し"); });
    startLoop((_, timeUp) => {
      if (timeUp) { finish(`時間切れ。${score}/12`, score >= 8); return; }
      setStatus("1から順に押す");
    });
  }

  // ── TYPING ────────────────────────────────────────────────────────────
  function initTyping() {
    clearBoard();
    const words = shuffle([
      "ゲーム","速度","反射","記憶","集中","入力","タイム","スコア",
      "青空","夜道","時計","光","音楽","地図","写真","旅","料理",
      "森","海","山","川","風","星","朝","夜","本","机",
      "タスク","メール","デザイン","コード","ウェブ","サイト",
      "ツール","テスト","レビュー","コメント","更新","公開",
    ].concat([
      "cat","dog","run","blue","fish","code","like","make","time","work",
      "link","post","play","read","sign","move","flow","grow","push","view",
    ]));
    let wordIdx = 0;
    let correct = 0;
    let current = "";

    board.innerHTML = `
      <div class="typing-stage">
        <div class="typing-word-wrap">
          <div class="typing-word" id="typingWord"></div>
          <div class="typing-sub" id="typingSub">入力して次へ進む</div>
        </div>
        <input class="typing-input" id="typingInput"
          type="text" autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false"
          placeholder="ここに入力…" />
      </div>`;

    const wordEl = board.querySelector("#typingWord");
    const sub = board.querySelector("#typingSub");
    const input = board.querySelector("#typingInput");

    const showWord = () => {
      current = words[wordIdx % words.length];
      wordIdx++;
      wordEl.textContent = current;
      wordEl.className = "typing-word";
      input.value = "";
      input.className = "typing-input";
      sub.textContent = `${correct}語 打てた`;
    };

    input.addEventListener("input", () => {
      if (!running) return;
      const val = input.value;
      if (val === current) {
        correct++; score = correct;
        wordEl.className = "typing-word word-ok";
        input.className = "typing-input input-ok";
        setTimeout(() => { showWord(); input.focus(); }, 130);
      } else if (current.startsWith(val)) {
        input.className = "typing-input";
      } else {
        input.className = "typing-input input-ng";
      }
    });

    showWord();
    setTimeout(() => input.focus(), 300);

    startLoop((_, timeUp) => {
      if (timeUp) {
        const label = correct >= 20 ? "⚡最速タイパー" : correct >= 12 ? "🟢速い方" : correct >= 7 ? "🟡普通" : "🐢もっと練習";
        finish(`${correct}語 / 30秒 — ${label}`, correct >= 8);
        input.blur();
        return;
      }
      score = correct;
      setStatus(`${correct}語 打てた`);
    });
  }

  // ── REACTION TIME ─────────────────────────────────────────────────────
  function initReaction() {
    clearBoard();
    const totalRounds = 3;
    const times = [];
    let roundNum = 0;
    let waitStart = 0;
    let isWaiting = false;
    let readyTimeout = null;
    let tooEarly = false;

    board.style.cursor = "pointer";
    board.innerHTML = `<div class="reaction-stage reaction-idle" id="reactionStage">
      <div class="reaction-icon" id="reactionIcon">👆</div>
      <div class="reaction-message" id="reactionMsg">スタートしたら画面をタップして待つ</div>
      <div class="reaction-sub" id="reactionSub">緑になった瞬間にタップ</div>
    </div>`;

    const stage = board.querySelector("#reactionStage");
    const icon = board.querySelector("#reactionIcon");
    const msg = board.querySelector("#reactionMsg");
    const sub = board.querySelector("#reactionSub");

    // Timer display: show round instead of countdown
    timeEl.textContent = `${roundNum}/${totalRounds}`;

    const showReady = () => {
      tooEarly = false; isWaiting = false;
      stage.className = "reaction-stage reaction-wait";
      icon.textContent = "⏳";
      msg.textContent = "準備中…";
      sub.textContent = "変わるまで待って！";
      const delay = 1500 + Math.random() * 3500;
      readyTimeout = setTimeout(() => {
        if (!running) return;
        stage.className = "reaction-stage reaction-go";
        icon.textContent = "⚡";
        msg.textContent = "今！！";
        sub.textContent = "今すぐタップ！";
        waitStart = performance.now();
        isWaiting = true;
      }, delay);
    };

    const tap = () => {
      if (!running) return;
      if (isWaiting) {
        const t = Math.round(performance.now() - waitStart);
        times.push(t);
        roundNum++;
        isWaiting = false;
        timeEl.textContent = `${roundNum}/${totalRounds}`;
        stage.className = "reaction-stage reaction-ok";
        icon.textContent = "✓";
        msg.textContent = `${t} ms`;
        sub.textContent = `${roundNum}/${totalRounds}回`;
        score = t;

        if (roundNum >= totalRounds) {
          const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          score = avg;
          const label = avg < 180 ? "⚡超反射神経！人間離れしてる" :
                        avg < 250 ? "🟢速い！ゲーマー級" :
                        avg < 350 ? "🟡普通の人間レベル" :
                        avg < 500 ? "🟠ちょっと遅め" :
                                    "🐌もしかして居眠り中？";
          setTimeout(() => {
            finish(`平均 ${avg}ms — ${label}`, avg < 350);
          }, 800);
          return;
        }
        setTimeout(() => { if (running) showReady(); }, 1200);
      } else if (!isWaiting && readyTimeout && !tooEarly) {
        // Early tap
        clearTimeout(readyTimeout);
        tooEarly = true;
        stage.className = "reaction-stage reaction-early";
        icon.textContent = "⛔";
        msg.textContent = "早すぎ！";
        sub.textContent = "緑になってから押して";
        setTimeout(() => { if (running) showReady(); }, 1400);
      }
    };

    stage.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      tap();
    });
    makeTapButton("タップ！", tap);

    // Use long timeLimit as safety valve; hide timer (show rounds instead)
    startLoop((_, timeUp) => {
      if (timeUp) finish("時間切れ");
    });

    showReady();
  }

  // ── MATH RUSH ─────────────────────────────────────────────────────────
  function initMath() {
    clearBoard();
    let correct = 0;

    board.innerHTML = `<div style="padding:24px;">
      <div class="prompt-box" id="mathPrompt" style="font-size:28px;text-align:center;letter-spacing:.04em;"></div>
      <div class="math-choices" id="mathChoices"></div>
      <div id="mathFeedback" class="math-feedback"></div>
    </div>`;

    const prompt = board.querySelector("#mathPrompt");
    const choices = board.querySelector("#mathChoices");
    const feedback = board.querySelector("#mathFeedback");

    const makeQ = () => {
      const type = pick(["add","sub","mul","mul"]);
      let a, b, answer;
      if (type === "add") { a = Math.floor(Math.random()*25)+3; b = Math.floor(Math.random()*25)+3; answer = a+b; }
      else if (type === "sub") { a = Math.floor(Math.random()*30)+15; b = Math.floor(Math.random()*14)+2; answer = a-b; }
      else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; answer = a*b; }
      const ops = { add:"+", sub:"−", mul:"×" };
      prompt.textContent = `${a}  ${ops[type]}  ${b}  ＝ ？`;

      const wrongs = new Set();
      while (wrongs.size < 3) {
        const off = pick([-5,-4,-3,-2,-1,1,2,3,4,5,6,-6,7,-7,10,-10]);
        const w = answer + off;
        if (w > 0 && w !== answer) wrongs.add(w);
      }
      const opts = shuffle([answer, ...[...wrongs]]);
      choices.innerHTML = "";
      opts.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "math-choice";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (!running) return;
          if (opt === answer) {
            correct++; score = correct;
            feedback.textContent = "✓ 正解！"; feedback.className = "math-feedback ok";
            setTimeout(() => { feedback.className = "math-feedback"; makeQ(); }, 300);
          } else {
            feedback.textContent = "✗ ちがう！"; feedback.className = "math-feedback ng";
            btn.classList.add("choice-wrong");
            setTimeout(() => { feedback.className = "math-feedback"; btn.classList.remove("choice-wrong"); }, 500);
          }
          setStats();
        });
        choices.appendChild(btn);
      });
    };

    makeQ();
    startLoop((_, timeUp) => {
      if (timeUp) {
        const label = correct >= 15 ? "🧮天才計算機！" : correct >= 10 ? "🟢速算家" : correct >= 6 ? "🟡まずまず" : "📚まだ練習中";
        finish(`${correct}問正解 / 30秒 — ${label}`, correct >= 6);
        return;
      }
      score = correct; setStatus(`${correct}問 正解`);
    });
  }

  // ── SEQUENCE (Simon Says) ─────────────────────────────────────────────
  function initSequence() {
    clearBoard();
    const COLORS = ["#0a765b","#1d4ed8","#dc2626","#d97706"];
    const EMOJIS = ["🟢","🔵","🔴","🟡"];
    let sequence = [];
    let playerSeq = [];
    let level = 0;
    let showing = false;

    board.innerHTML = `<div style="padding:20px 20px 8px;">
      <div class="seq-level-badge" id="seqLevel">レベル0</div>
      <div class="seq-grid" id="seqGrid"></div>
      <div class="seq-msg" id="seqMsg">スタートしたら光る順番を覚えて</div>
    </div>`;

    const levelBadge = board.querySelector("#seqLevel");
    const grid = board.querySelector("#seqGrid");
    const msg = board.querySelector("#seqMsg");
    const btns = [];

    COLORS.forEach((color, i) => {
      const btn = document.createElement("button");
      btn.className = "seq-btn";
      btn.dataset.idx = i;
      btn.style.setProperty("--sc", color);
      btn.textContent = EMOJIS[i];
      btn.addEventListener("pointerdown", (e) => { e.preventDefault(); onPlayerTap(i); });
      grid.appendChild(btn);
      btns.push(btn);
    });

    const flash = (idx, ms = 480) => new Promise(resolve => {
      btns[idx].classList.add("seq-active");
      setTimeout(() => {
        btns[idx].classList.remove("seq-active");
        setTimeout(resolve, 80);
      }, ms);
    });

    const showSequence = async () => {
      showing = true;
      msg.textContent = "見て覚えて…";
      await new Promise(r => setTimeout(r, 700));
      const speed = Math.max(250, 480 - level * 18);
      for (const idx of sequence) {
        if (!running) return;
        await flash(idx, speed);
      }
      showing = false;
      playerSeq = [];
      msg.textContent = `同じ順番で押して（${level}個）`;
    };

    const nextLevel = () => {
      level++;
      score = level - 1;
      levelBadge.textContent = `レベル ${level}`;
      sequence.push(Math.floor(Math.random() * 4));
      setStatus(`レベル ${level}`);
      showSequence();
    };

    const onPlayerTap = (idx) => {
      if (!running || showing) return;
      flash(idx, 200);
      playerSeq.push(idx);
      const pos = playerSeq.length - 1;

      if (playerSeq[pos] !== sequence[pos]) {
        score = level - 1;
        msg.textContent = `❌ レベル${level}で失敗`;
        const label = level >= 12 ? "🧠記憶の達人！" : level >= 8 ? "🟢すごい！" : level >= 5 ? "🟡まずまず" : "🔰もう一回チャレンジ";
        finish(`レベル ${level - 1} クリア — ${label}`, level >= 5);
        return;
      }
      if (playerSeq.length === sequence.length) {
        score = level;
        msg.textContent = `✓ 正解！次のレベルへ`;
        setTimeout(() => { if (running) nextLevel(); }, 700);
      }
    };

    nextLevel();
    startLoop((_, timeUp) => {
      if (timeUp) finish(`時間切れ。レベル ${level - 1}`, level >= 5);
    });
  }

  // ── GAME ROUTER ───────────────────────────────────────────────────────
  function startGame() {
    resetCommon();
    running = true;
    setStatus(cfg.runningText || "プレイ中");
    if (cfg.hideTimer) timeEl.textContent = "—";
    if (cfg.mode === "dodge")    return initDodge("dodge");
    if (cfg.mode === "collect")  return initDodge("collect");
    if (cfg.mode === "stack")    return initStack();
    if (cfg.mode === "color")    return initColor();
    if (cfg.mode === "memory")   return initMemory();
    if (cfg.mode === "orbit")    return initOrbit();
    if (cfg.mode === "tap")      return initTap();
    if (cfg.mode === "number")   return initNumber();
    if (cfg.mode === "typing")   return initTyping();
    if (cfg.mode === "reaction") return initReaction();
    if (cfg.mode === "math")     return initMath();
    if (cfg.mode === "sequence") return initSequence();
  }

  function resetGame() {
    cancelAnimationFrame(raf);
    resetCommon();
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => { resetGame(); startGame(); });
  setHints(cfg.hints || []);
  setStats();
  setStatus(cfg.startText || "スタートを押して開始");
  showSharedResult();
})();
