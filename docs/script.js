let previousXP = 0;
let previousLevel = 0;
let hasInteracted = false;

const levelEl = document.getElementById("level");
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const leaderboardEl = document.getElementById("leaderboard");
const achievementsEl = document.getElementById("achievements");
const tooltipEl = document.getElementById("achievement-tooltip");
let activeAchievement = null;
let leaderboardLoaded = false;

const levelUpSound = new Audio("sounds/level-up.mp3");
const coinSound = new Audio("sounds/coin.mp3");

window.addEventListener("click", () => {
  hasInteracted = true;
});

function calculateLevel(xp) {
  let level = 0;
  let required = 200;
  let remaining = xp;

  while (remaining >= required) {
    remaining -= required;
    required = Math.round((required * 1.1) / 10) * 10;
    level++;
  }

  return {
    level,
    currentXP: remaining,
    xpToNext: required,
    totalXP: xp,
  };
}

function animateXPBar(currentXP, xpToNext) {
  let current = parseInt(xpBar.value || 0, 10);
  const distance = Math.abs(currentXP - current);
  const increment = Math.ceil(distance / 120) || 1;
  const direction = currentXP >= current ? 1 : -1;

  const animate = () => {
    current += increment * direction;
    if ((direction === 1 && current > currentXP) || (direction === -1 && current < currentXP)) {
      current = currentXP;
    }
    xpBar.value = current;
    xpText.textContent = `${current} / ${xpToNext} XP`;

    if (current !== currentXP) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

function showBadgeTooltip(img) {
  if (!tooltipEl) return;
  tooltipEl.innerHTML = `<strong>${img.dataset.title}</strong><br>${img.dataset.xp} XP - Level ${img.dataset.level}`;
  const rect = img.getBoundingClientRect();
  tooltipEl.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  tooltipEl.style.top = `${rect.top + window.scrollY - 8}px`;
  tooltipEl.classList.add("show");
}

function hideBadgeTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove("show");
}

function getAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const paramToken = params.get("token");
  if (paramToken) {
    try {
      localStorage.setItem("github_token", paramToken);
    } catch (e) {
      console.warn("Unable to store token in localStorage", e);
    }
    return paramToken;
  }
  try {
    return localStorage.getItem("github_token");
  } catch (e) {
    return null;
  }
}

function loadAchievementsAndXP() {
  fetch(`xp.json?t=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => {
      const badges = data.badges || [];

      achievementsEl.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.display = "flex";
      grid.style.flexWrap = "wrap";
      grid.style.justifyContent = "center";
      grid.style.gap = "1rem";
      grid.style.padding = "1rem";
      grid.style.maxWidth = "700px";
      grid.style.margin = "0 auto";

      badges.forEach((badge) => {
        const file = badge.file || badge;
        const xp = badge.xp || parseInt((file.match(/_(\d+)xp_/i) || [0, 0])[1]);
        const level = badge.level || parseInt((file.match(/(?:_|-)lvl(\d+)/i) || [0, 1])[1]);
        let title = badge.title;
        if (!title) {
          let namePart = file.replace(/\.png$/i, "");
          const lvlMatch = namePart.match(/(?:_|-)lvl(\d+)/i);
          if (lvlMatch) namePart = namePart.replace(lvlMatch[0], "");
          namePart = namePart.replace(/^[0-9]+_/, "").replace(/_(\d+)xp_?/i, "");
          title = namePart.replace(/[_-]/g, " ").trim();
        }

        const displayTitle = `${title.toUpperCase()} - ${xp} XP - Level ${level}`;

        const img = document.createElement("img");
        img.src = `achievements/${file}`;
        img.alt = displayTitle;
        img.title = displayTitle;
        img.className = "achievement";
        img.dataset.title = title;
        img.dataset.xp = xp;
        img.dataset.level = level;

        img.addEventListener("mouseenter", () => showBadgeTooltip(img));
        img.addEventListener("mouseleave", () => {
          if (activeAchievement !== img) hideBadgeTooltip();
        });
        img.addEventListener("click", (e) => {
          e.stopPropagation();
          if (activeAchievement === img) {
            img.classList.remove("active");
            activeAchievement = null;
            hideBadgeTooltip();
          } else {
            if (activeAchievement) activeAchievement.classList.remove("active");
            activeAchievement = img;
            img.classList.add("active");
            showBadgeTooltip(img);
          }
        });

        grid.appendChild(img);
      });

      achievementsEl.appendChild(grid);

      updateDisplay({
        xp: data.xp || 0,
        leaderboard: data.leaderboard || [],
      });
    });
}

function updateDisplay(data) {
  const progress = calculateLevel(data.xp);
  if (!levelEl || !xpBar || !xpText || !leaderboardEl) return;

  const leveledUp = progress.level > previousLevel;

  if (leveledUp && hasInteracted) {
    levelUpSound.play();
    const previousMax = Math.round(progress.xpToNext / 1.1 / 10) * 10;
    animateXPBar(previousMax, previousMax);
    xpText.textContent = `${previousMax} / ${previousMax} XP`;

    let confettiCount = 0;
    const confettiInterval = setInterval(() => {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      confettiCount++;
      if (confettiCount >= 10) clearInterval(confettiInterval);
    }, 1000);

    setTimeout(() => {
      levelEl.textContent = progress.level;
      xpBar.max = progress.xpToNext;
      animateXPBar(progress.currentXP, progress.xpToNext);
    }, 10000);
  } else {
    levelEl.textContent = progress.level;
    xpBar.max = progress.xpToNext;
    animateXPBar(progress.currentXP, progress.xpToNext);
  }


  if (leaderboardLoaded) {
    leaderboardEl.classList.add("loaded");
  }
  leaderboardEl.innerHTML = "";
  data.leaderboard
    .sort((a, b) => b.xp - a.xp)
    .forEach((entry) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = `https://github.com/${entry.user}.png?size=64`;
      img.alt = entry.user;
      const span = document.createElement("span");
      span.textContent = `${entry.user} - ${entry.xp} XP`;
      li.appendChild(img);
      li.appendChild(span);
      leaderboardEl.appendChild(li);
    });
  if (!leaderboardLoaded) {
    leaderboardLoaded = true;
  }
  previousLevel = progress.level;
  previousXP = progress.totalXP;
}

fetchAndUpdate = loadAchievementsAndXP;
fetchAndUpdate();
// Poll every 30 seconds instead of 10 to reduce API requests
setInterval(fetchAndUpdate, 30000);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".achievement")) {
    if (activeAchievement) {
      activeAchievement.classList.remove("active");
      activeAchievement = null;
    }
    hideBadgeTooltip();
  }
});
