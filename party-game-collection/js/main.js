const FAVORITES_KEY = "pgc_favorites";

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

function isFavorite(gameId) {
  return getFavorites().includes(gameId);
}

function toggleFavorite(gameId) {
  const favs = getFavorites();
  const idx = favs.indexOf(gameId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(gameId);
  }
  saveFavorites(favs);
  syncFavoriteButtons();
  document.dispatchEvent(new CustomEvent("pgc:favoritesChanged", { detail: favs }));
}

function syncFavoriteButtons() {
  const favs = getFavorites();
  const favCountBadge = document.getElementById("favCountBadge");
  if (favCountBadge) {
    favCountBadge.textContent = String(favs.length);
  }
  document.querySelectorAll("[data-fav-id]").forEach((btn) => {
    const id = btn.getAttribute("data-fav-id");
    const active = favs.includes(id);
    btn.classList.toggle("is-fav", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    if (btn.classList.contains("fav-btn-text")) {
      btn.textContent = active ? "★ 已收藏" : "☆ 收藏此遊戲";
    } else {
      btn.textContent = active ? "★" : "☆";
      btn.title = active ? "取消收藏" : "加入收藏";
    }
  });
}

function createGameCardElement(game, basePath = "") {
  const card = document.createElement("article");
  card.className = "game-card";

  const activeFav = isFavorite(game.id);
  const materialsText = game.materials.join("、");

  card.innerHTML = `
    <div>
      <div class="game-card-top">
        <span class="game-num">${game.number}</span>
        <div class="game-card-actions">
          <span class="badge-cat">${game.categoryLabel}</span>
          <button
            type="button"
            class="fav-btn ${activeFav ? "is-fav" : ""}"
            data-fav-id="${game.id}"
            aria-label="收藏 ${game.name}"
            aria-pressed="${activeFav ? "true" : "false"}"
            title="${activeFav ? "取消收藏" : "加入收藏"}"
          >${activeFav ? "★" : "☆"}</button>
        </div>
      </div>
      <h3 class="game-title">${game.name}</h3>
      <p class="game-en">${game.englishName}</p>
      <p class="game-desc">${game.description}</p>
    </div>
    <div>
      <div class="game-meta">
        <span class="meta-chip">👥 ${game.players}</span>
        <span class="meta-chip">⏱ ${game.duration}</span>
        <span class="meta-chip">🎒 ${materialsText}</span>
      </div>
      <a class="game-card-link" href="${basePath}pages/games/${game.id}.html">
        <span>查看完整規則</span>
        <span>→</span>
      </a>
    </div>
  `;

  const favBtn = card.querySelector("[data-fav-id]");
  favBtn.addEventListener("click", () => toggleFavorite(game.id));

  return card;
}

/* Party Countdown Timer */
let timerTotalSeconds = 60;
let timerRemaining = 60;
let timerInterval = null;

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio errors
  }
}

function updateTimerDisplay() {
  const display = document.getElementById("timerDisplay");
  if (display) {
    display.textContent = formatTime(timerRemaining);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const startBtn = document.getElementById("timerStartBtn");
  if (startBtn) startBtn.textContent = "開始計時";
}

function initTimerModal() {
  const modal = document.getElementById("timerModal");
  if (!modal) return;

  document.querySelectorAll("[data-open-timer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.classList.add("open");
      updateTimerDisplay();
    });
  });

  const closeBtn = modal.querySelector("[data-close-modal]");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  modal.querySelectorAll("[data-timer-sec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopTimer();
      timerTotalSeconds = Number(btn.getAttribute("data-timer-sec"));
      timerRemaining = timerTotalSeconds;
      updateTimerDisplay();
    });
  });

  const startBtn = document.getElementById("timerStartBtn");
  const resetBtn = document.getElementById("timerResetBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (timerInterval) {
        stopTimer();
        return;
      }
      if (timerRemaining <= 0) {
        timerRemaining = timerTotalSeconds;
      }
      startBtn.textContent = "暫停";
      timerInterval = setInterval(() => {
        timerRemaining -= 1;
        updateTimerDisplay();
        if (timerRemaining <= 0) {
          stopTimer();
          playBeep();
        }
      }, 1000);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      stopTimer();
      timerRemaining = timerTotalSeconds;
      updateTimerDisplay();
    });
  }
}

function renderCategoryPage(categoryId) {
  const grid = document.getElementById("categoryGamesGrid");
  if (!grid || typeof GAMES_DATA === "undefined") return;
  const matched = GAMES_DATA.filter((g) => g.category === categoryId);
  grid.innerHTML = "";
  matched.forEach((game) => {
    grid.appendChild(createGameCardElement(game, "../../"));
  });
}

function renderRelatedGames(categoryId, currentGameId) {
  const grid = document.getElementById("relatedGamesGrid");
  if (!grid || typeof GAMES_DATA === "undefined") return;
  const related = GAMES_DATA.filter(
    (g) => g.category === categoryId && g.id !== currentGameId
  ).slice(0, 3);
  grid.innerHTML = "";
  related.forEach((game) => {
    grid.appendChild(createGameCardElement(game, "../../"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTimerModal();
  document.querySelectorAll("[data-fav-id]").forEach((btn) => {
    if (!btn.closest(".game-card")) {
      btn.addEventListener("click", () => {
        toggleFavorite(btn.getAttribute("data-fav-id"));
      });
    }
  });
  syncFavoriteButtons();

  const categoryContainer = document.getElementById("categoryGamesGrid");
  if (categoryContainer) {
    const catId = categoryContainer.getAttribute("data-category-id");
    if (catId) renderCategoryPage(catId);
  }

  const relatedContainer = document.getElementById("relatedGamesGrid");
  if (relatedContainer) {
    const catId = relatedContainer.getAttribute("data-category-id");
    const gameId = relatedContainer.getAttribute("data-current-game");
    if (catId && gameId) renderRelatedGames(catId, gameId);
  }
});
