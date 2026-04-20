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
  let best = Number(localStorage.getItem(bestKey) || 0);
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
  const lanes = 3;
  const laneX = (lane) => ((lane + 0.5) / lanes) * W();

  function setStats() {
    scoreEl.textContent = String(score);
    timeEl.textContent = `${Math.max(0, Math.ceil(timeLeft))}秒`;
    bestEl.textContent = String(best);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

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
    if (score > best) {
      best = score;
      localStorage.setItem(bestKey, String(best));
      bestEl.textContent = String(best);
    }
    setStatus(message);
    if (win) {
      board.insertAdjacentHTML("beforeend", `<div class="game-banner">CLEAR</div>`);
    }
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
    board.addEventListener("pointerdown", (e) => {
      if (!running) return;
      state.lastX = e.clientX;
    });
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
      if (state.spawnTimer >= state.spawnEvery) {
        state.spawnTimer = 0;
        spawn();
      }
      const speed = kind === "collect" ? 240 : 270;
      const playerY = H() - 58;
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += speed * dt;
        if (item.y > H() + 40) {
          item.el.remove();
          items.splice(i, 1);
          continue;
        }
        const hit = item.lane === playerLane.value && Math.abs(item.y - playerY) < 28;
        if (hit) {
          if (kind === "collect") {
            if (item.bomb) {
              finish("💥 爆弾に当たった");
              return;
            }
            score += 1;
            item.el.remove();
            items.splice(i, 1);
            if (score >= target) {
              finish("CLEAR! 目標まで集めた", true);
              return;
            }
          } else {
            finish("ぶつかった。もう一回");
            return;
          }
        }
      }
      draw();
      if (timeUp) {
        if (kind === "collect" && score >= target) {
          finish("CLEAR! 目標達成", true);
        } else if (kind === "collect") {
          finish("時間切れ。もう少しで届く");
        } else {
          finish("時間切れ。生存成功", true);
        }
        return;
      }
      if (kind === "dodge") score = Math.floor((cfg.timeLimit || 30) - timeLeft);
      setStats();
      setStatus(kind === "collect" ? "星を拾って、爆弾だけ避ける" : "障害物をよけて生き残る");
    });
    draw();
  }

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
      const yBase = H() - 56;
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
      if (overlap <= 30) {
        finish("ズレすぎた。もう一回");
        return;
      }
      const newWidth = Math.max(80, overlap);
      const newX = clamp(centered - newWidth / 2, 28, W() - newWidth - 28);
      const layer = document.createElement("div");
      layer.className = "stack-layer";
      board.appendChild(layer);
      placed.push({ el: layer, x: newX, width: newWidth });
      layers += 1;
      score = layers;
      currentWidth = newWidth;
      movingX = rand(20, W() - currentWidth - 20);
      speed += 12;
      if (layers >= goal) {
        finish("CLEAR! タワー完成", true);
        return;
      }
      dropping = false;
    }

    const step = (dt, timeUp) => {
      if (timeUp) {
        finish("時間切れ。積み上げ途中");
        return;
      }
      movingX += direction * speed * dt;
      if (movingX <= 20) { movingX = 20; direction = 1; }
      if (movingX >= W() - currentWidth - 20) { movingX = W() - currentWidth - 20; direction = -1; }
      render();
      score = layers;
      setStatus("タイミングよくタップして積む");
    };

    makeTapButton("DROP", drop);
    window.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") drop();
    });
    board.addEventListener("pointerdown", drop);
    startLoop(step);
    render();
  }

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
    let choices = [];
    board.innerHTML = `<div style="padding:24px;"><div class="prompt-box" id="prompt"></div><div class="color-grid" id="choices"></div></div>`;
    const prompt = board.querySelector("#prompt");
    const choiceWrap = board.querySelector("#choices");

    const next = () => {
      current = pick(colors);
      choices = shuffle(colors.slice());
      prompt.textContent = `この色はどれ？  ${current.name.toUpperCase()}`;
      choiceWrap.innerHTML = "";
      choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "color-choice";
        btn.textContent = c.name;
        btn.style.background = `linear-gradient(180deg, ${c.hex}18 0%, #fff 100%)`;
        btn.addEventListener("click", () => {
          if (!running) return;
          if (c.name === current.name) {
            round += 1;
            score = round;
            setStatus("正解。次へ");
            if (round >= 10) {
              finish("CLEAR! 10問クリア", true);
              return;
            }
            next();
          } else {
            setStatus("ちがう。もう1回");
          }
          setStats();
        });
        choiceWrap.appendChild(btn);
      });
    };

    next();
    makeTapButton("次の色", () => next());
    startLoop((_, timeUp) => {
      if (timeUp) {
        finish(`時間切れ。${round}問`, round >= 6);
        return;
      }
      score = round;
      setStatus("色の名前とボタンを合わせる");
    });
  }

  function initMemory() {
    clearBoard();
    const deck = shuffle(["🍀","🌙","🔥","💎","🍒","⚡","🎯","🧠","🍀","🌙","🔥","💎","🍒","⚡","🎯","🧠"]);
    const revealed = [];
    const matched = new Set();
    board.innerHTML = `<div style="padding:20px;"><div class="memory-grid" id="memGrid"></div></div>`;
    const grid = board.querySelector("#memGrid");
    let busy = false;
    let moves = 0;
    let pairs = 0;

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
          revealed.push(idx);
          moves += 1;
          render();
          if (revealed.length === 2) {
            busy = true;
            const [a, b] = revealed;
            if (deck[a] === deck[b]) {
              matched.add(a); matched.add(b);
              pairs += 1;
              score = pairs;
              revealed.length = 0;
              busy = false;
              render();
              if (pairs >= 8) finish("CLEAR! 全ペア完成", true);
            } else {
              setTimeout(() => {
                revealed.length = 0;
                busy = false;
                render();
              }, 650);
            }
          }
        });
        grid.appendChild(card);
      });
    };

    render();
    makeTapButton("シャッフル", () => {
      if (!running) return;
      finish("やり直し");
    });
    startLoop((_, timeUp) => {
      if (timeUp) {
        finish(`時間切れ。${pairs}組`);
        return;
      }
      score = pairs;
      setStatus("同じ絵を2枚そろえる");
      setStats();
    });
  }

  function initOrbit() {
    clearBoard();
    board.classList.add("orbit-stage");
    board.innerHTML = `<div class="orbit-ring"></div><div class="orbit-center"></div>`;
    const ring = 150;
    let angle = 0;
    let hazards = [];
    let spawn = 0;
    let scoreSeconds = 0;
    const player = document.createElement("div");
    player.className = "orb";
    board.appendChild(player);

    function drawOrb(el, a, r, extra = 0) {
      const cx = W() / 2;
      const cy = H() / 2;
      el.style.left = `${cx + Math.cos(a + extra) * r}px`;
      el.style.top = `${cy + Math.sin(a + extra) * r}px`;
    }

    function move(dir) {
      if (!running) return;
      angle += dir * 0.14;
    }

    makeTouchButtons("↺ 左回り", "右回り ↻", { left: () => move(-1), right: () => move(1) });
    window.addEventListener("keydown", (e) => {
      if (!running) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });

    const tick = (dt, timeUp) => {
      if (timeUp) {
        finish(`CLEAR! ${Math.floor(scoreSeconds)}秒生存`, true);
        return;
      }
      scoreSeconds = (cfg.timeLimit || 30) - timeLeft;
      score = Math.floor(scoreSeconds);
      spawn += dt;
      if (spawn > 1.1) {
        spawn = 0;
        const el = document.createElement("div");
        el.className = "orb";
        el.style.background = "#ffddd6";
        el.style.borderColor = "#ef4444";
        board.appendChild(el);
        hazards.push({ el, angle: rand(0, Math.PI * 2), speed: rand(0.7, 1.4) * (Math.random() < 0.5 ? -1 : 1) });
      }
      angle += dt * 0.7;
      drawOrb(player, angle, ring);
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.angle += h.speed * dt * 0.9;
        drawOrb(h.el, h.angle, ring);
        const diff = Math.abs(((h.angle - angle + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (diff < 0.23) {
          finish("当たった。もう一回");
          return;
        }
      }
      setStatus("ぐるっと回って、赤い障害物を避ける");
    };

    startLoop(tick);
    drawOrb(player, angle, ring);
  }

  function initTap() {
    clearBoard();
    let hits = 0;
    let spawned = 0;
    const targets = [];
    const spawnTarget = () => {
      if (!running) return;
      spawned += 1;
      const el = document.createElement("button");
      el.className = "target";
      el.textContent = "✦";
      el.style.left = `${rand(36, W() - 36)}px`;
      el.style.top = `${rand(36, H() - 36)}px`;
      el.style.width = el.style.height = `${rand(42, 66)}px`;
      el.addEventListener("click", () => {
        if (!running) return;
        hits += 1;
        score = hits;
        el.remove();
        targets.splice(targets.indexOf(el), 1);
        if (hits >= 20) finish("CLEAR! 20個たたけた", true);
      });
      board.appendChild(el);
      targets.push(el);
      setTimeout(() => {
        if (el.isConnected) el.remove();
      }, 1300);
    };

    makeTapButton("ターゲットを出す", () => spawnTarget());
    startLoop((dt, timeUp) => {
      if (timeUp) {
        finish(`時間切れ。${hits}個`, hits >= 12);
        return;
      }
      if (Math.random() < 0.03) spawnTarget();
      setStatus("出た丸をひたすらタップ");
      score = hits;
    });
  }

  function initNumber() {
    clearBoard();
    const nums = shuffle(Array.from({ length: 12 }, (_, i) => i + 1));
    const order = { value: 1 };
    const grid = document.createElement("div");
    grid.className = "number-grid";
    grid.style.padding = "20px";
    board.appendChild(grid);

    const render = () => {
      grid.innerHTML = "";
      nums.forEach((n) => {
        const btn = document.createElement("button");
        btn.className = "number-tile";
        btn.textContent = n;
        btn.addEventListener("click", () => {
          if (!running) return;
          if (n === order.value) {
            order.value += 1;
            score = order.value - 1;
            btn.style.opacity = "0.35";
            btn.disabled = true;
            if (order.value > 12) {
              finish("CLEAR! 数字を全部押せた", true);
              return;
            }
            setStatus(`次は ${order.value}`);
          } else {
            btn.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 180 });
          }
        });
        grid.appendChild(btn);
      });
    };
    render();
    makeTapButton("並び替え", () => {
      if (!running) return;
      finish("やり直し");
    });
    startLoop((_, timeUp) => {
      if (timeUp) {
        finish(`時間切れ。${score}/12`, score >= 8);
        return;
      }
      setStatus("1から順に押す");
    });
  }

  function startGame() {
    resetCommon();
    running = true;
    setStatus(cfg.runningText || "プレイ中");
    if (cfg.mode === "dodge") return initDodge("dodge");
    if (cfg.mode === "collect") return initDodge("collect");
    if (cfg.mode === "stack") return initStack();
    if (cfg.mode === "color") return initColor();
    if (cfg.mode === "memory") return initMemory();
    if (cfg.mode === "orbit") return initOrbit();
    if (cfg.mode === "tap") return initTap();
    if (cfg.mode === "number") return initNumber();
  }

  function resetGame() {
    cancelAnimationFrame(raf);
    resetCommon();
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    resetGame();
    startGame();
  });

  setHints(cfg.hints || []);
  setStats();
  setStatus(cfg.startText || "スタートを押して開始");
})();
