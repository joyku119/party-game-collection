document.addEventListener("DOMContentLoaded", () => {
  if (typeof GAMES_DATA === "undefined") return;

  const modal = document.getElementById("randomModal");
  const openBtns = document.querySelectorAll("[data-open-random]");
  const rerollBtn = document.getElementById("rerollRandomBtn");

  if (!modal) return;

  let lastPickedId = null;

  function pickRandomGame() {
    if (GAMES_DATA.length === 0) return null;
    let pool = GAMES_DATA;
    if (GAMES_DATA.length > 1 && lastPickedId) {
      pool = GAMES_DATA.filter((g) => g.id !== lastPickedId);
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastPickedId = chosen.id;
    return chosen;
  }

  function renderRandomModal(game) {
    if (!game) return;
    document.getElementById("randomModalCategory").textContent = `${game.number} · ${game.categoryLabel}`;
    document.getElementById("randomModalTitle").textContent = game.name;
    document.getElementById("randomModalEn").textContent = game.englishName;
    document.getElementById("randomModalDesc").textContent = game.description;
    document.getElementById("randomModalPlayers").textContent = `👥 ${game.players}`;
    document.getElementById("randomModalDuration").textContent = `⏱ ${game.duration}`;
    document.getElementById("randomModalMaterials").textContent = `🎒 ${game.materials.join("、")}`;

    const startEl = document.getElementById("randomModalStart");
    if (startEl) {
      startEl.textContent =
        game.steps && game.steps.length > 0
          ? game.steps[0]
          : "點擊下方查看完整規則即可開局！";
    }

    const link = document.getElementById("randomModalLink");
    if (link) {
      link.href = `pages/games/${game.id}.html`;
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const game = pickRandomGame();
      renderRandomModal(game);
      modal.classList.add("open");
    });
  });

  if (rerollBtn) {
    rerollBtn.addEventListener("click", () => {
      const game = pickRandomGame();
      renderRandomModal(game);
    });
  }

  const closeBtn = modal.querySelector("[data-close-modal]");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});
