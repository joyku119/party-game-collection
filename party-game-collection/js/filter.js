document.addEventListener("DOMContentLoaded", () => {
  if (typeof GAMES_DATA === "undefined" || typeof CATEGORIES_DATA === "undefined") {
    return;
  }

  const categoriesGrid = document.getElementById("categoriesGrid");
  const featuredGrid = document.getElementById("featuredGamesGrid");
  const allGamesGrid = document.getElementById("allGamesGrid");
  const filterPills = document.getElementById("filterPills");
  const searchInput = document.getElementById("searchInput");
  const favFilterBtn = document.getElementById("favFilterBtn");
  const clearPlayerFilterBtn = document.getElementById("clearPlayerFilterBtn");
  const resultsMeta = document.getElementById("resultsMeta");
  const totalCountEl = document.getElementById("totalGamesCount");

  // Player & Tool Recommender Elements
  const playerPresets = document.getElementById("playerPresets");
  const toolPresets = document.getElementById("toolPresets");
  const playerCountInput = document.getElementById("playerCountInput");
  const playerMinusBtn = document.getElementById("playerMinusBtn");
  const playerPlusBtn = document.getElementById("playerPlusBtn");
  const recommenderDrawer = document.getElementById("recommenderDrawer");
  const recommenderSummary = document.getElementById("recommenderSummary");
  const recommendedGamesGrid = document.getElementById("recommendedGamesGrid");
  const shuffleRecommendBtn = document.getElementById("shuffleRecommendBtn");
  const applyPlayerFilterBtn = document.getElementById("applyPlayerFilterBtn");
  const closeRecommenderBtn = document.getElementById("closeRecommenderBtn");

  if (totalCountEl) {
    totalCountEl.textContent = String(GAMES_DATA.length);
  }

  let activeCategory = "all";
  let searchQuery = "";
  let onlyFavorites = false;
  let activePlayerFilter = null;
  let activeToolFilter = [];
  let currentRecommendedCount = 4;
  let selectedTools = [];

  const TOOL_LABELS = {
    none: "零道具",
    cards: "撲克牌 / 角色卡",
    dice: "骰子",
    phone: "手機 / 題庫 / 計時器",
    paper: "紙筆 / 便利貼",
    other: "UNO / 積木 / 杯子"
  };

  function matchesToolKey(game, toolKey) {
    const matText = game.materials.join(" ");
    switch (toolKey) {
      case "none":
        return matText.includes("無道具");
      case "cards":
        return matText.includes("撲克牌") || matText.includes("角色卡");
      case "dice":
        return matText.includes("骰子") || matText.includes("骰盅");
      case "phone":
        return (
          matText.includes("手機") ||
          matText.includes("計時器") ||
          matText.includes("題目") ||
          matText.includes("題庫") ||
          matText.includes("圖片") ||
          matText.includes("藍牙喇叭") ||
          matText.includes("耳機")
        );
      case "paper":
        return (
          matText.includes("紙筆") ||
          matText.includes("便利貼") ||
          matText.includes("紙條") ||
          matText.includes("繪圖")
        );
      case "other":
        return (
          matText.includes("UNO") ||
          matText.includes("積木") ||
          matText.includes("塑膠杯") ||
          matText.includes("寶特瓶") ||
          matText.includes("空瓶子") ||
          matText.includes("公杯") ||
          matText.includes("大碗公") ||
          matText.includes("成對圖卡")
        );
      default:
        return true;
    }
  }

  function matchesAnySelectedTool(game, toolsArr) {
    if (!toolsArr || toolsArr.length === 0) return true;
    return toolsArr.some((toolKey) => matchesToolKey(game, toolKey));
  }

  function getRecommendedGames(count, toolsArr) {
    return GAMES_DATA.filter((g) => {
      const playerOk = count >= (g.minPlayers || 2) && count <= (g.maxPlayers || 99);
      const toolOk = matchesAnySelectedTool(g, toolsArr);
      return playerOk && toolOk;
    });
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function syncToolButtons() {
    if (!toolPresets) return;
    const allBtn = toolPresets.querySelector('[data-tool-preset="all"]');
    if (allBtn) {
      allBtn.classList.toggle("active", selectedTools.length === 0);
    }
    toolPresets.querySelectorAll("[data-tool-preset]").forEach((btn) => {
      const key = btn.getAttribute("data-tool-preset");
      if (key !== "all") {
        btn.classList.toggle("active", selectedTools.includes(key));
      }
    });
  }

  function showPlayerRecommendations(count) {
    const safeCount = Math.max(2, Math.min(20, Number(count) || 4));
    currentRecommendedCount = safeCount;
    if (playerCountInput) playerCountInput.value = String(safeCount);

    if (playerPresets) {
      playerPresets.querySelectorAll("[data-player-preset]").forEach((btn) => {
        const val = Number(btn.getAttribute("data-player-preset"));
        const isMatch = val === 10 ? safeCount >= 10 : val === safeCount;
        btn.classList.toggle("active", isMatch);
      });
    }

    syncToolButtons();

    const matched = getRecommendedGames(safeCount, selectedTools);
    const picks = shuffleArray(matched).slice(0, 3);

    if (recommenderSummary) {
      const countLabel = safeCount >= 10 ? "10 人以上" : `${safeCount} 人`;
      const toolLabel =
        selectedTools.length > 0
          ? ` ＋ ${selectedTools.map((k) => TOOL_LABELS[k]).join(" / ")}`
          : "";
      recommenderSummary.innerHTML = `符合 <strong>${countLabel}${toolLabel}</strong> 的遊戲共有 <strong>${matched.length} 款</strong>，為你們精選以下推薦：`;
    }

    if (recommendedGamesGrid) {
      recommendedGamesGrid.innerHTML = "";
      if (picks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<p>目前條件沒有完全符合的遊戲，試試多勾選「零道具」或調整人數！</p>`;
        recommendedGamesGrid.appendChild(empty);
      } else {
        picks.forEach((game) => {
          recommendedGamesGrid.appendChild(createGameCardElement(game, ""));
        });
      }
    }

    if (recommenderDrawer) {
      recommenderDrawer.classList.add("open");
    }
  }

  if (playerPresets) {
    playerPresets.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-player-preset]");
      if (!btn) return;
      showPlayerRecommendations(Number(btn.getAttribute("data-player-preset")));
    });
  }

  if (toolPresets) {
    toolPresets.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tool-preset]");
      if (!btn) return;
      const key = btn.getAttribute("data-tool-preset");
      if (key === "all") {
        selectedTools = [];
      } else {
        const idx = selectedTools.indexOf(key);
        if (idx >= 0) {
          selectedTools.splice(idx, 1);
        } else {
          selectedTools.push(key);
        }
      }
      showPlayerRecommendations(currentRecommendedCount);
    });
  }

  if (playerMinusBtn && playerCountInput) {
    playerMinusBtn.addEventListener("click", () => {
      showPlayerRecommendations(Number(playerCountInput.value) - 1);
    });
  }

  if (playerPlusBtn && playerCountInput) {
    playerPlusBtn.addEventListener("click", () => {
      showPlayerRecommendations(Number(playerCountInput.value) + 1);
    });
  }

  if (playerCountInput) {
    playerCountInput.addEventListener("change", () => {
      showPlayerRecommendations(Number(playerCountInput.value));
    });
  }

  if (shuffleRecommendBtn) {
    shuffleRecommendBtn.addEventListener("click", () => {
      showPlayerRecommendations(currentRecommendedCount);
    });
  }

  if (closeRecommenderBtn && recommenderDrawer) {
    closeRecommenderBtn.addEventListener("click", () => {
      recommenderDrawer.classList.remove("open");
    });
  }

  if (applyPlayerFilterBtn) {
    applyPlayerFilterBtn.addEventListener("click", () => {
      activePlayerFilter = currentRecommendedCount;
      activeToolFilter = [...selectedTools];
      if (clearPlayerFilterBtn) {
        clearPlayerFilterBtn.style.display = "inline-flex";
        const toolText =
          activeToolFilter.length > 0
            ? ` + ${activeToolFilter.map((k) => TOOL_LABELS[k]).join("/")}`
            : "";
        clearPlayerFilterBtn.textContent = `✕ ${activePlayerFilter} 人${toolText}（清除）`;
      }
      renderFilteredGames();
      const libraryEl = document.getElementById("library");
      if (libraryEl) libraryEl.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (clearPlayerFilterBtn) {
    clearPlayerFilterBtn.addEventListener("click", () => {
      activePlayerFilter = null;
      activeToolFilter = [];
      clearPlayerFilterBtn.style.display = "none";
      renderFilteredGames();
    });
  }

  if (categoriesGrid) {
    categoriesGrid.innerHTML = "";
    CATEGORIES_DATA.forEach((cat) => {
      const count = GAMES_DATA.filter((g) => g.category === cat.id).length;
      const card = document.createElement("a");
      card.className = "category-card";
      card.href = `pages/categories/${cat.id}.html`;
      card.innerHTML = `
        <div class="category-top">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-count">${count} 款遊戲</span>
        </div>
        <h3 class="category-name">${cat.name}</h3>
        <p class="category-feature">${cat.feature}</p>
      `;
      categoriesGrid.appendChild(card);
    });
  }

  if (featuredGrid) {
    featuredGrid.innerHTML = "";
    GAMES_DATA.filter((g) => g.featured)
      .slice(0, 6)
      .forEach((game) => {
        featuredGrid.appendChild(createGameCardElement(game, ""));
      });
  }

  if (filterPills) {
    const allPill = document.createElement("button");
    allPill.type = "button";
    allPill.className = "filter-pill active";
    allPill.textContent = `全部 (${GAMES_DATA.length})`;
    allPill.dataset.category = "all";
    filterPills.appendChild(allPill);

    CATEGORIES_DATA.forEach((cat) => {
      const count = GAMES_DATA.filter((g) => g.category === cat.id).length;
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "filter-pill";
      pill.textContent = `${cat.icon} ${cat.name} (${count})`;
      pill.dataset.category = cat.id;
      filterPills.appendChild(pill);
    });

    filterPills.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      activeCategory = btn.dataset.category;
      filterPills.querySelectorAll(".filter-pill").forEach((el) => {
        el.classList.toggle("active", el === btn);
      });
      renderFilteredGames();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderFilteredGames();
    });
  }

  if (favFilterBtn) {
    favFilterBtn.addEventListener("click", () => {
      onlyFavorites = !onlyFavorites;
      favFilterBtn.classList.toggle("active", onlyFavorites);
      favFilterBtn.innerHTML = onlyFavorites
        ? `★ 顯示全部遊戲`
        : `☆ 只看我的收藏 (<span id="favCountBadge">${getFavorites().length}</span>)`;
      renderFilteredGames();
    });
  }

  document.addEventListener("pgc:favoritesChanged", () => {
    if (onlyFavorites) renderFilteredGames();
  });

  function renderFilteredGames() {
    if (!allGamesGrid) return;
    const favs = getFavorites();

    const filtered = GAMES_DATA.filter((game) => {
      if (activeCategory !== "all" && game.category !== activeCategory) {
        return false;
      }
      if (onlyFavorites && !favs.includes(game.id)) {
        return false;
      }
      if (activePlayerFilter !== null) {
        if (
          activePlayerFilter < (game.minPlayers || 2) ||
          activePlayerFilter > (game.maxPlayers || 99)
        ) {
          return false;
        }
      }
      if (activeToolFilter.length > 0 && !matchesAnySelectedTool(game, activeToolFilter)) {
        return false;
      }
      if (searchQuery) {
        const haystack = [
          game.name,
          game.englishName,
          game.categoryLabel,
          game.description,
          game.players,
          game.materials.join(" ")
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchQuery);
      }
      return true;
    });

    if (resultsMeta) {
      resultsMeta.textContent = `目前顯示 ${filtered.length} / ${GAMES_DATA.length} 款遊戲`;
    }

    allGamesGrid.innerHTML = "";
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `
        <p style="font-size: 1.05rem; margin-bottom: 8px;">找不到符合條件的遊戲</p>
        <p style="font-size: 0.88rem; color: var(--text-muted);">試試清除搜尋關鍵字、人數與道具篩選，或點擊上方「不知道玩什麼？」隨機抽一款！</p>
      `;
      allGamesGrid.appendChild(empty);
      return;
    }

    filtered.forEach((game) => {
      allGamesGrid.appendChild(createGameCardElement(game, ""));
    });
  }

  renderFilteredGames();
});
