document.addEventListener("DOMContentLoaded", () => {
  const PLAYERS_KEY = "pgc_host_players";
  const DEFAULT_PLAYERS = [
    { name: "Joy", score: 0 },
    { name: "Amy", score: 0 },
    { name: "Kevin", score: 0 },
    { name: "Tom", score: 0 },
    { name: "Mia", score: 0 }
  ];

  let players = loadPlayers();
  let pickedPlayerIdx = null;
  let activeConsole = "werewolf";

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(PLAYERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PLAYERS.map((p) => ({ ...p }));
  }

  function savePlayers() {
    try {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    } catch {
      // ignore
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- 1. Player Manager ---------- */
  const newPlayerInput = document.getElementById("newPlayerInput");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const hostPlayerList = document.getElementById("hostPlayerList");
  const hostPlayerCountBadge = document.getElementById("hostPlayerCountBadge");
  const shufflePlayersBtn = document.getElementById("shufflePlayersBtn");
  const pickRandomPlayerBtn = document.getElementById("pickRandomPlayerBtn");
  const splitTeamsBtn = document.getElementById("splitTeamsBtn");
  const resetScoresBtn = document.getElementById("resetScoresBtn");
  const playerActionBanner = document.getElementById("playerActionBanner");

  function showPlayerBanner(html) {
    if (!playerActionBanner) return;
    playerActionBanner.innerHTML = html;
    playerActionBanner.classList.add("show");
  }

  function renderPlayers() {
    if (!hostPlayerList) return;
    hostPlayerList.innerHTML = "";
    if (hostPlayerCountBadge) {
      hostPlayerCountBadge.textContent = `${players.length} 人`;
    }

    players.forEach((player, idx) => {
      const item = document.createElement("div");
      item.className = `player-item ${pickedPlayerIdx === idx ? "is-picked" : ""}`;
      item.innerHTML = `
        <div class="player-name-wrap">
          <span class="player-idx">${idx + 1}</span>
          <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(player.name)}</span>
        </div>
        <div class="player-score-wrap">
          <button type="button" class="mini-btn" data-score-delta="-1" data-idx="${idx}" title="扣 1 分">−</button>
          <span class="player-score" title="目前累積積分">${player.score} 分</span>
          <button type="button" class="mini-btn" data-score-delta="1" data-idx="${idx}" title="加 1 分">+</button>
          <button type="button" class="mini-btn" data-remove-idx="${idx}" title="從名單移除此玩家" style="color: var(--text-muted);">✕</button>
        </div>
      `;
      hostPlayerList.appendChild(item);
    });

    savePlayers();
    if (activeConsole === "most-likely-to" || activeConsole === "generic" || activeConsole === "charades") {
      renderActiveConsole();
    }
  }

  function addPlayer() {
    if (!newPlayerInput) return;
    const name = newPlayerInput.value.trim();
    if (!name) return;
    players.push({ name, score: 0 });
    newPlayerInput.value = "";
    pickedPlayerIdx = null;
    renderPlayers();
  }

  if (addPlayerBtn) addPlayerBtn.addEventListener("click", addPlayer);
  if (newPlayerInput) {
    newPlayerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPlayer();
    });
  }

  if (hostPlayerList) {
    hostPlayerList.addEventListener("click", (e) => {
      const scoreBtn = e.target.closest("[data-score-delta]");
      if (scoreBtn) {
        const idx = Number(scoreBtn.getAttribute("data-idx"));
        const delta = Number(scoreBtn.getAttribute("data-score-delta"));
        if (players[idx]) {
          players[idx].score += delta;
          renderPlayers();
        }
        return;
      }
      const removeBtn = e.target.closest("[data-remove-idx]");
      if (removeBtn) {
        const idx = Number(removeBtn.getAttribute("data-remove-idx"));
        players.splice(idx, 1);
        pickedPlayerIdx = null;
        renderPlayers();
      }
    });
  }

  if (shufflePlayersBtn) {
    shufflePlayersBtn.addEventListener("click", () => {
      for (let i = players.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }
      pickedPlayerIdx = 0;
      renderPlayers();
      if (players.length > 0) {
        showPlayerBanner(`🔀 已打亂順序！由第 1 位 <strong>${escapeHtml(players[0].name)}</strong> 先開始。`);
      }
    });
  }

  if (pickRandomPlayerBtn) {
    pickRandomPlayerBtn.addEventListener("click", () => {
      if (players.length === 0) return;
      pickedPlayerIdx = Math.floor(Math.random() * players.length);
      renderPlayers();
      showPlayerBanner(`🎯 隨機抽中：<strong>${escapeHtml(players[pickedPlayerIdx].name)}</strong>`);
    });
  }

  if (splitTeamsBtn) {
    splitTeamsBtn.addEventListener("click", () => {
      if (players.length < 2) {
        showPlayerBanner("至少需要 2 位玩家才能分組喔！");
        return;
      }
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const mid = Math.ceil(shuffled.length / 2);
      const teamA = shuffled.slice(0, mid).map((p) => escapeHtml(p.name)).join("、");
      const teamB = shuffled.slice(mid).map((p) => escapeHtml(p.name)).join("、");
      showPlayerBanner(`⚔️ <strong>A 隊：</strong>${teamA}<br/>🛡️ <strong>B 隊：</strong>${teamB}`);
    });
  }

  if (resetScoresBtn) {
    resetScoresBtn.addEventListener("click", () => {
      players.forEach((p) => { p.score = 0; });
      pickedPlayerIdx = null;
      renderPlayers();
      showPlayerBanner("🔄 所有玩家的積分已全部歸零！");
    });
  }

  /* ---------- 2. Host Countdown Timer ---------- */
  let timerTotal = 60;
  let timerLeft = 60;
  let timerId = null;

  const hostTimerDisplay = document.getElementById("hostTimerDisplay");
  const hostTimerStartBtn = document.getElementById("hostTimerStartBtn");
  const hostTimerResetBtn = document.getElementById("hostTimerResetBtn");

  function fmt(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function beepHost() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // ignore
    }
  }

  function stopHostTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (hostTimerStartBtn) hostTimerStartBtn.textContent = "開始計時";
  }

  function updateHostTimerUI() {
    if (hostTimerDisplay) hostTimerDisplay.textContent = fmt(timerLeft);
  }

  document.querySelectorAll("[data-host-sec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopHostTimer();
      timerTotal = Number(btn.getAttribute("data-host-sec"));
      timerLeft = timerTotal;
      updateHostTimerUI();
      document.querySelectorAll("[data-host-sec]").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  if (hostTimerStartBtn) {
    hostTimerStartBtn.addEventListener("click", () => {
      if (timerId) {
        stopHostTimer();
        return;
      }
      if (timerLeft <= 0) timerLeft = timerTotal;
      hostTimerStartBtn.textContent = "暫停";
      timerId = setInterval(() => {
        timerLeft -= 1;
        updateHostTimerUI();
        if (timerLeft <= 0) {
          stopHostTimer();
          beepHost();
        }
      }, 1000);
    });
  }

  if (hostTimerResetBtn) {
    hostTimerResetBtn.addEventListener("click", () => {
      stopHostTimer();
      timerLeft = timerTotal;
      updateHostTimerUI();
    });
  }

  /* ---------- 3. Auxiliary Tools Tabs (Questions & Challenges) ---------- */
  const auxTabs = document.getElementById("auxTabs");
  const auxPanelQuestions = document.getElementById("auxPanelQuestions");
  const auxPanelChallenges = document.getElementById("auxPanelChallenges");

  if (auxTabs) {
    auxTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-aux-tab]");
      if (!btn) return;
      const tab = btn.getAttribute("data-aux-tab");
      auxTabs.querySelectorAll("[data-aux-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      if (auxPanelQuestions) auxPanelQuestions.classList.toggle("active", tab === "questions");
      if (auxPanelChallenges) auxPanelChallenges.classList.toggle("active", tab === "challenges");
    });
  }

  const questionThemeSelect = document.getElementById("questionThemeSelect");
  const questionLevelSelect = document.getElementById("questionLevelSelect");
  const questionTag = document.getElementById("questionTag");
  const questionText = document.getElementById("questionText");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");

  function drawQuestion() {
    if (typeof HOST_QUESTIONS === "undefined") return;
    const theme = questionThemeSelect ? questionThemeSelect.value : "all";
    const level = questionLevelSelect ? questionLevelSelect.value : "all";
    const pool = HOST_QUESTIONS.filter((q) => {
      if (theme !== "all" && q.theme !== theme) return false;
      if (level !== "all" && q.level !== level) return false;
      return true;
    });
    const finalPool = pool.length > 0 ? pool : HOST_QUESTIONS;
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
    if (questionTag) {
      questionTag.textContent = `${picked.theme} · ${picked.level === "spicy" ? "微辣" : "輕鬆"}`;
    }
    if (questionText) questionText.textContent = picked.text;
  }

  if (nextQuestionBtn) nextQuestionBtn.addEventListener("click", drawQuestion);

  const challengeDiffSelect = document.getElementById("challengeDiffSelect");
  const challengeTypeSelect = document.getElementById("challengeTypeSelect");
  const challengeTag = document.getElementById("challengeTag");
  const challengeText = document.getElementById("challengeText");
  const nextChallengeBtn = document.getElementById("nextChallengeBtn");
  const skipChallengeBtn = document.getElementById("skipChallengeBtn");

  function drawChallenge() {
    if (typeof HOST_CHALLENGES === "undefined") return;
    const diff = challengeDiffSelect ? challengeDiffSelect.value : "all";
    const type = challengeTypeSelect ? challengeTypeSelect.value : "all";
    const pool = HOST_CHALLENGES.filter((c) => {
      if (diff !== "all" && c.difficulty !== diff) return false;
      if (type !== "all" && c.type !== type) return false;
      return true;
    });
    const finalPool = pool.length > 0 ? pool : HOST_CHALLENGES;
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
    if (challengeTag) challengeTag.textContent = `${picked.type} · ${picked.difficulty}`;
    if (challengeText) challengeText.textContent = picked.text;
  }

  if (nextChallengeBtn) nextChallengeBtn.addEventListener("click", drawChallenge);
  if (skipChallengeBtn) {
    skipChallengeBtn.addEventListener("click", () => {
      if (challengeTag) challengeTag.textContent = "安全免罰 · 已跳過";
      if (challengeText) challengeText.textContent = "尊重個人界線！本回合安全跳過，可繼續下一輪或改喝一口無酒精飲品。";
    });
  }

  /* ---------- 4. Game-Specific Host Consoles ---------- */
  const consoleQuickTabs = document.getElementById("consoleQuickTabs");
  const consoleStage = document.getElementById("consoleStage");

  function setConsole(mode) {
    activeConsole = mode;
    if (consoleQuickTabs) {
      consoleQuickTabs.querySelectorAll("[data-console-tab]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-console-tab") === mode);
      });
    }
    renderActiveConsole();
  }

  if (consoleQuickTabs) {
    consoleQuickTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-console-tab]");
      if (btn) setConsole(btn.getAttribute("data-console-tab"));
    });
  }

  // Console states
  let wwRoles = [];
  let wwRevealIdx = 0;
  let wwRevealed = false;
  let wwPhase = "夜晚：天黑請閉眼";

  let chDiff = "easy";
  let chPerformerIdx = 0;
  let chCorrectCount = 0;
  let chPrompt = "點擊「換一題」開始表演！";

  let mltQuestion = "誰最有可能在出國前一天晚上才開始收行李？";
  let mltVotes = {};

  let nbMin = 1;
  let nbMax = 100;
  let nbBomb = Math.floor(Math.random() * 100) + 1;
  let nbShowBomb = false;
  let nbStatus = "請玩家輪流報數，主持人輸入數字即可自動縮小安全範圍！";

  let ucWordPair = ["珍珠奶茶", "波霸奶茶"];
  let ucAssignments = [];
  let ucRevealIdx = 0;
  let ucRevealed = false;

  let genericTurnIdx = 0;
  let genericSelectedGameId = "heart-attack";

  function renderActiveConsole() {
    if (!consoleStage) return;
    if (activeConsole === "werewolf") renderWerewolfConsole();
    else if (activeConsole === "charades") renderCharadesConsole();
    else if (activeConsole === "most-likely-to") renderMostLikelyConsole();
    else if (activeConsole === "who-is-undercover") renderUndercoverConsole();
    else if (activeConsole === "number-bomb") renderNumberBombConsole();
    else renderGenericConsole();
  }

  /* A. Werewolf Console */
  function assignWerewolfRoles() {
    if (players.length < 4) {
      alert("建議在左側先新增至少 4 位玩家，再分配狼人殺角色喔！");
      return;
    }
    const n = players.length;
    const wolfCount = n >= 9 ? 3 : n >= 6 ? 2 : 1;
    const deck = [];
    for (let i = 0; i < wolfCount; i += 1) {
      deck.push({ role: "🐺 狼人", desc: "夜晚與隊友討論淘汰一名玩家，白天隱藏身分偽裝成好人。" });
    }
    deck.push({ role: "🔮 預言家", desc: "每晚可查驗一名玩家的真實陣營（好人或狼人）。" });
    if (n >= 5) {
      deck.push({ role: "🧪 女巫", desc: "擁有一瓶解藥與一瓶毒藥，可救人或淘汰一名玩家（各限一次）。" });
    }
    while (deck.length < n) {
      deck.push({ role: "🧑 村民", desc: "沒有特殊技能，靠白天的觀察與邏輯投票找出狼人。" });
    }
    deck.sort(() => Math.random() - 0.5);
    wwRoles = players.map((p, idx) => ({
      name: p.name,
      role: deck[idx].role,
      desc: deck[idx].desc,
      alive: true
    }));
    wwRevealIdx = 0;
    wwRevealed = false;
    wwPhase = "夜晚：天黑請閉眼";
    renderWerewolfConsole();
  }

  function renderWerewolfConsole() {
    const phases = ["夜晚：天黑請閉眼", "白天：公布昨夜與討論", "投票：放逐嫌疑人"];
    const phaseButtons = phases
      .map(
        (ph) =>
          `<button type="button" class="filter-pill ${wwPhase === ph ? "active" : ""}" data-ww-phase="${ph}">${ph}</button>`
      )
      .join("");

    let revealHtml = "";
    if (wwRoles.length === 0) {
      revealHtml = `<p style="color: var(--text-secondary); margin: 12px 0;">目前共有 <strong>${players.length}</strong> 位玩家，點擊右上角「分配角色並發牌」，就能輪流傳手機給大家看秘密身分！</p>`;
    } else if (wwRevealIdx < wwRoles.length) {
      const curr = wwRoles[wwRevealIdx];
      revealHtml = `
        <div class="role-reveal-card">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">秘密身分發放進度 (${wwRevealIdx + 1} / ${wwRoles.length})</p>
          <h3 style="font-size: 1.4rem; margin-bottom: 12px;">請將手機交給：${escapeHtml(curr.name)}</h3>
          ${
            wwRevealed
              ? `<div style="margin: 14px 0;">
                   <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 6px;">${curr.role}</p>
                   <p style="font-size: 0.9rem; color: var(--text-secondary);">${curr.desc}</p>
                 </div>
                 <button type="button" class="btn btn-primary" id="wwNextRevealBtn">看完了，隱藏並交給下一位 →</button>`
              : `<button type="button" class="btn btn-secondary" id="wwShowRoleBtn">👁 點擊查看我的秘密身分</button>`
          }
        </div>
      `;
    } else {
      const aliveWolves = wwRoles.filter((r) => r.alive && r.role.includes("狼人")).length;
      const aliveGoods = wwRoles.filter((r) => r.alive && !r.role.includes("狼人")).length;
      let statusMsg = `場上存活：🐺 狼人 ${aliveWolves} 位 ｜ 🧑 好人 ${aliveGoods} 位`;
      if (aliveWolves === 0) statusMsg = "🎉 遊戲結束：所有狼人已出局，好人陣營獲勝！";
      else if (aliveWolves >= aliveGoods) statusMsg = "🐺 遊戲結束：狼人數量已達好人數量，狼人陣營獲勝！";

      const rosterHtml = wwRoles
        .map(
          (r, i) => `
          <div class="vote-card ${r.alive ? "" : "is-out"}" data-ww-toggle="${i}">
            <div style="font-weight: 700;">${escapeHtml(r.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${r.alive ? "✅ 存活（點擊淘汰）" : "💀 已出局"}</div>
          </div>`
        )
        .join("");

      revealHtml = `
        <div class="host-result-banner show" style="margin-bottom: 14px;">${statusMsg}</div>
        <div class="phase-pills">${phaseButtons}</div>
        <div class="vote-grid">${rosterHtml}</div>
      `;
    }

    consoleStage.innerHTML = `
      <div class="host-card-header" style="margin-bottom: 10px;">
        <h3 style="font-size: 1.15rem;">🐺 狼人殺｜主持人控制台</h3>
        <button type="button" class="btn btn-primary" id="wwAssignBtn">🔀 分配角色並發牌</button>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> ① 先在左側確認玩家名單 → ② 按「分配角色並發牌」依序傳手機看身分 → ③ 遊戲中切換夜晚／白天階段，點擊出局玩家卡片即可自動判定勝負。
      </div>
      ${revealHtml}
    `;

    document.getElementById("wwAssignBtn").addEventListener("click", assignWerewolfRoles);
    const showBtn = document.getElementById("wwShowRoleBtn");
    if (showBtn) {
      showBtn.addEventListener("click", () => {
        wwRevealed = true;
        renderWerewolfConsole();
      });
    }
    const nextBtn = document.getElementById("wwNextRevealBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        wwRevealed = false;
        wwRevealIdx += 1;
        renderWerewolfConsole();
      });
    }
    consoleStage.querySelectorAll("[data-ww-phase]").forEach((btn) => {
      btn.addEventListener("click", () => {
        wwPhase = btn.getAttribute("data-ww-phase");
        renderWerewolfConsole();
      });
    });
    consoleStage.querySelectorAll("[data-ww-toggle]").forEach((card) => {
      card.addEventListener("click", () => {
        const i = Number(card.getAttribute("data-ww-toggle"));
        if (wwRoles[i]) {
          wwRoles[i].alive = !wwRoles[i].alive;
          renderWerewolfConsole();
        }
      });
    });
  }

  /* B. Charades Console */
  function drawCharadesPrompt() {
    if (typeof CHARADES_PROMPTS === "undefined") return;
    const list = CHARADES_PROMPTS[chDiff] || CHARADES_PROMPTS.easy;
    chPrompt = list[Math.floor(Math.random() * list.length)];
    renderCharadesConsole();
  }

  function renderCharadesConsole() {
    const performer = players.length > 0 ? players[chPerformerIdx % players.length].name : "尚未新增玩家";
    consoleStage.innerHTML = `
      <div class="host-card-header">
        <h3 style="font-size: 1.15rem;">🎭 比手畫腳｜題目與計時控制台</h3>
        <span class="badge-cat">本回合答對：${chCorrectCount} 題</span>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> ① 選擇題目難度並按左側計時器開始倒數 → ② 讓目前表演者看大字題目並用動作演出 → ③ 隊友猜對按「✅ 答對 +1 分」，會自動幫該玩家在左側加分並換下一題！
      </div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
        <div>目前表演者：<strong style="color: var(--accent-primary); font-size: 1.05rem;">${escapeHtml(performer)}</strong></div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="filter-pill ${chDiff === "easy" ? "active" : ""}" data-ch-diff="easy">簡單日常</button>
          <button type="button" class="filter-pill ${chDiff === "medium" ? "active" : ""}" data-ch-diff="medium">進階動作</button>
          <button type="button" class="filter-pill ${chDiff === "hard" ? "active" : ""}" data-ch-diff="hard">電影流行梗</button>
        </div>
      </div>
      <div class="big-prompt-box">
        <span class="big-prompt-tag">請用動作演出（不可出聲）</span>
        <p class="big-prompt-text" style="font-size: 1.8rem;">${escapeHtml(chPrompt)}</p>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        <button type="button" class="btn btn-primary" id="chCorrectBtn">✅ 答對 +1 分（換下一題）</button>
        <button type="button" class="btn btn-secondary" id="chSkipBtn">⏭ 跳過換題</button>
        <button type="button" class="btn btn-ghost" id="chNextPerformerBtn">🔄 換下一位表演者</button>
      </div>
    `;

    consoleStage.querySelectorAll("[data-ch-diff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chDiff = btn.getAttribute("data-ch-diff");
        drawCharadesPrompt();
      });
    });

    document.getElementById("chCorrectBtn").addEventListener("click", () => {
      chCorrectCount += 1;
      if (players.length > 0) {
        players[chPerformerIdx % players.length].score += 1;
        renderPlayers();
      }
      drawCharadesPrompt();
    });

    document.getElementById("chSkipBtn").addEventListener("click", drawCharadesPrompt);
    document.getElementById("chNextPerformerBtn").addEventListener("click", () => {
      if (players.length > 0) {
        chPerformerIdx = (chPerformerIdx + 1) % players.length;
      }
      chCorrectCount = 0;
      drawCharadesPrompt();
    });
  }

  /* C. Most Likely To Console */
  function renderMostLikelyConsole() {
    const voteCards = players
      .map((p) => {
        const v = mltVotes[p.name] || 0;
        return `
          <div class="vote-card" data-mlt-vote="${escapeHtml(p.name)}">
            <div style="font-weight: 600;">${escapeHtml(p.name)}</div>
            <div class="vote-count">${v} 票</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">點擊 +1 票</div>
          </div>`;
      })
      .join("");

    let maxVotes = 0;
    let leaders = [];
    Object.entries(mltVotes).forEach(([name, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        leaders = [name];
      } else if (count === maxVotes && count > 0) {
        leaders.push(name);
      }
    });

    consoleStage.innerHTML = `
      <div class="host-card-header">
        <h3 style="font-size: 1.15rem;">👉 誰最有可能｜投票統計控制台</h3>
        <button type="button" class="btn btn-secondary" id="mltNewQBtn">🎲 抽新題目</button>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> ① 念出下方題目，全員倒數 3 秒同時指向心中人選 → ② 主持人點擊下方玩家卡片幫被指到的人計票 → ③ 最高票者可到下方「懲罰任務抽籤」抽一題分享或表演！
      </div>
      <div class="big-prompt-box">
        <span class="big-prompt-tag">大家一起倒數 3 秒指向目標</span>
        <p class="big-prompt-text">${escapeHtml(mltQuestion)}</p>
      </div>
      <div class="vote-grid">${voteCards}</div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px;">
        <div style="font-size: 0.95rem;">
          ${maxVotes > 0 ? `🏆 目前最高票：<strong style="color: var(--accent-primary);">${leaders.map(escapeHtml).join("、")}</strong>（${maxVotes} 票）` : "點擊上方玩家卡片即可累計投票數"}
        </div>
        <button type="button" class="btn btn-ghost" id="mltResetVotesBtn">🔄 清除本題票數</button>
      </div>
    `;

    document.getElementById("mltNewQBtn").addEventListener("click", () => {
      if (typeof HOST_QUESTIONS !== "undefined") {
        mltQuestion = HOST_QUESTIONS[Math.floor(Math.random() * HOST_QUESTIONS.length)].text;
      }
      mltVotes = {};
      renderMostLikelyConsole();
    });

    document.getElementById("mltResetVotesBtn").addEventListener("click", () => {
      mltVotes = {};
      renderMostLikelyConsole();
    });

    consoleStage.querySelectorAll("[data-mlt-vote]").forEach((card) => {
      card.addEventListener("click", () => {
        const name = card.getAttribute("data-mlt-vote");
        mltVotes[name] = (mltVotes[name] || 0) + 1;
        renderMostLikelyConsole();
      });
    });
  }

  /* D. Number Bomb Console */
  function renderNumberBombConsole() {
    consoleStage.innerHTML = `
      <div class="host-card-header">
        <h3 style="font-size: 1.15rem;">💣 數字炸彈｜主持人控制台</h3>
        <button type="button" class="btn btn-secondary" id="nbResetBtn">🔄 重新生成炸彈</button>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> 系統已自動生成 1–100 秘密炸彈（預設隱藏）。玩家每喊一個數字，主持人輸入並按「確認數字」，畫面會自動縮小安全範圍直到有人踩雷！
      </div>
      <div class="big-prompt-box">
        <span class="big-prompt-tag">目前安全區間</span>
        <p class="big-prompt-text" style="font-size: 2.2rem; color: var(--accent-primary);">${nbMin} ～ ${nbMax}</p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 8px;">${nbStatus}</p>
      </div>
      <div class="host-input-row">
        <input type="number" id="nbGuessInput" class="host-input" min="${nbMin}" max="${nbMax}" placeholder="輸入玩家猜測的數字（${nbMin}–${nbMax}）..." />
        <button type="button" class="btn btn-primary" id="nbGuessBtn">確認數字</button>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
        <span>秘密炸彈數字：${nbShowBomb ? `<strong style="color: var(--accent-primary);">${nbBomb}</strong>` : "●●（已隱藏）"}</span>
        <button type="button" class="btn btn-ghost" id="nbTogglePeekBtn">${nbShowBomb ? "🙈 隱藏炸彈" : "👁 主持人偷看"}</button>
      </div>
    `;

    document.getElementById("nbResetBtn").addEventListener("click", () => {
      nbMin = 1;
      nbMax = 100;
      nbBomb = Math.floor(Math.random() * 100) + 1;
      nbStatus = "已生成全新 1–100 秘密炸彈，請開始輪流報數！";
      renderNumberBombConsole();
    });

    document.getElementById("nbTogglePeekBtn").addEventListener("click", () => {
      nbShowBomb = !nbShowBomb;
      renderNumberBombConsole();
    });

    const submitGuess = () => {
      const val = Number(document.getElementById("nbGuessInput").value);
      if (!val || val < nbMin || val > nbMax) {
        nbStatus = `⚠️ 請輸入 ${nbMin} 到 ${nbMax} 之間的數字！`;
        renderNumberBombConsole();
        return;
      }
      if (val === nbBomb) {
        nbStatus = `💥 轟！！猜中炸彈數字 ${nbBomb}！請該位玩家到下方「懲罰任務抽籤」抽一個任務！`;
        beepHost();
      } else if (val < nbBomb) {
        nbMin = val + 1;
        nbStatus = `安全過關！範圍縮小至 ${nbMin} ～ ${nbMax}`;
      } else {
        nbMax = val - 1;
        nbStatus = `安全過關！範圍縮小至 ${nbMin} ～ ${nbMax}`;
      }
      renderNumberBombConsole();
    };

    document.getElementById("nbGuessBtn").addEventListener("click", submitGuess);
    document.getElementById("nbGuessInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitGuess();
    });
  }

  /* E. Who is Undercover Console */
  function assignUndercoverWords() {
    if (players.length < 3) {
      alert("建議在左側先新增至少 3 位玩家，再進行誰是臥底！");
      return;
    }
    if (typeof UNDERCOVER_WORD_PAIRS !== "undefined") {
      ucWordPair = UNDERCOVER_WORD_PAIRS[Math.floor(Math.random() * UNDERCOVER_WORD_PAIRS.length)];
    }
    const undercoverIdx = Math.floor(Math.random() * players.length);
    ucAssignments = players.map((p, i) => ({
      name: p.name,
      word: i === undercoverIdx ? ucWordPair[1] : ucWordPair[0],
      isUndercover: i === undercoverIdx,
      alive: true
    }));
    ucRevealIdx = 0;
    ucRevealed = false;
    renderUndercoverConsole();
  }

  function renderUndercoverConsole() {
    let bodyHtml = "";
    if (ucAssignments.length === 0) {
      bodyHtml = `<p style="color: var(--text-secondary); margin: 12px 0;">點擊「發放秘密詞語」後，系統會隨機挑選一組相似詞，並秘密分配 1 位臥底給目前的 ${players.length} 位玩家。</p>`;
    } else if (ucRevealIdx < ucAssignments.length) {
      const curr = ucAssignments[ucRevealIdx];
      bodyHtml = `
        <div class="role-reveal-card">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">詞語發放進度 (${ucRevealIdx + 1} / ${ucAssignments.length})</p>
          <h3 style="font-size: 1.4rem; margin-bottom: 12px;">請將手機交給：${escapeHtml(curr.name)}</h3>
          ${
            ucRevealed
              ? `<p style="font-size: 1.7rem; font-weight: 700; color: var(--accent-primary); margin: 14px 0;">${escapeHtml(curr.word)}</p>
                 <button type="button" class="btn btn-primary" id="ucNextBtn">記住了，隱藏並交給下一位 →</button>`
              : `<button type="button" class="btn btn-secondary" id="ucShowBtn">👁 點擊查看我的詞語</button>`
          }
        </div>
      `;
    } else {
      const cards = ucAssignments
        .map(
          (a, i) => `
          <div class="vote-card ${a.alive ? "" : "is-out"}" data-uc-toggle="${i}">
            <div style="font-weight: 700;">${escapeHtml(a.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
              ${a.alive ? "✅ 發言中（點擊淘汰）" : a.isUndercover ? "🕵️ 出局（他是臥底！）" : "🧑 出局（他是平民）"}
            </div>
          </div>`
        )
        .join("");
      bodyHtml = `
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">所有玩家皆已確認詞語！請輪流發言描述，點擊被投票出局的玩家卡片即可公布是否為臥底。</p>
        <div class="vote-grid">${cards}</div>
      `;
    }

    consoleStage.innerHTML = `
      <div class="host-card-header">
        <h3 style="font-size: 1.15rem;">🕵️ 誰是臥底｜秘密詞語分配台</h3>
        <button type="button" class="btn btn-primary" id="ucAssignBtn">🔀 發放新詞語</button>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> ① 按「發放新詞語」依序傳手機給每位玩家看自己的詞 → ② 大家輪流用一句話描述詞語 → ③ 投票後點擊被投出玩家的卡片即可揭曉身分。
      </div>
      ${bodyHtml}
    `;

    document.getElementById("ucAssignBtn").addEventListener("click", assignUndercoverWords);
    const showBtn = document.getElementById("ucShowBtn");
    if (showBtn) {
      showBtn.addEventListener("click", () => {
        ucRevealed = true;
        renderUndercoverConsole();
      });
    }
    const nextBtn = document.getElementById("ucNextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        ucRevealed = false;
        ucRevealIdx += 1;
        renderUndercoverConsole();
      });
    }
    consoleStage.querySelectorAll("[data-uc-toggle]").forEach((card) => {
      card.addEventListener("click", () => {
        const i = Number(card.getAttribute("data-uc-toggle"));
        if (ucAssignments[i]) {
          ucAssignments[i].alive = !ucAssignments[i].alive;
          renderUndercoverConsole();
        }
      });
    });
  }

  /* F. Generic Turn Console */
  function renderGenericConsole() {
    const gamesList = typeof GAMES_DATA !== "undefined" ? GAMES_DATA : [];
    const selected = gamesList.find((g) => g.id === genericSelectedGameId) || gamesList[0];
    const currPlayer = players.length > 0 ? players[genericTurnIdx % players.length].name : "尚未新增玩家";
    const options = gamesList
      .map(
        (g) =>
          `<option value="${g.id}" ${selected && g.id === selected.id ? "selected" : ""}>${g.number}｜${g.name}（${g.players}）</option>`
      )
      .join("");

    consoleStage.innerHTML = `
      <div class="host-card-header" style="flex-wrap: wrap;">
        <h3 style="font-size: 1.15rem;">🎲 通用回合與步驟主持台</h3>
        <select id="genericGamePicker" class="host-select">${options}</select>
      </div>
      <div class="console-guide-banner">
        <strong>使用說明：</strong> 從下拉選單挑選 50 款中的任一款遊戲，即可一邊對照玩法步驟、一邊按「下一位玩家」控制輪流順序！
      </div>
      <div class="big-prompt-box" style="text-align: left; padding: 18px 20px;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px;">
          <span class="big-prompt-tag" style="margin-bottom: 0;">目前輪到玩家：${escapeHtml(currPlayer)}</span>
          <button type="button" class="btn btn-primary" id="genericNextTurnBtn">換下一位玩家 →</button>
        </div>
        ${
          selected
            ? `<p style="font-weight: 700; font-size: 1.08rem; margin-bottom: 6px;">${selected.name} — ${selected.description}</p>
               <ol style="padding-left: 20px; font-size: 0.88rem; color: var(--text-secondary);">
                 ${selected.steps.map((s) => `<li style="margin-bottom: 4px;">${escapeHtml(s)}</li>`).join("")}
               </ol>`
            : ""
        }
      </div>
    `;

    const picker = document.getElementById("genericGamePicker");
    if (picker) {
      picker.addEventListener("change", () => {
        genericSelectedGameId = picker.value;
        renderGenericConsole();
      });
    }
    document.getElementById("genericNextTurnBtn").addEventListener("click", () => {
      if (players.length > 0) {
        genericTurnIdx = (genericTurnIdx + 1) % players.length;
      }
      renderGenericConsole();
    });
  }

  /* Init */
  renderPlayers();
  renderActiveConsole();
});
