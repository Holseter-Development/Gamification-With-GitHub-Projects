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

function loadAchievementsAndXP() {
  const hostParts = window.location.hostname.split(".");
  let owner = hostParts[0];
  let repo = window.location.pathname.replace(/^\//, "").split("/")[0] || "Gamification-With-GitHub-Projects";

  if (hostParts[0] === "www" && hostParts.length > 2) {
    owner = hostParts[1];
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/docs/achievements`;
  console.log("Fetching achievements from", apiUrl);
  fetch(apiUrl)
    .then((res) => res.json())
    .then((files) => {
      if (!Array.isArray(files)) return;

      const badgeFiles = files.filter((f) =>
        f.name.match(/^[0-9]+_[0-9]+xp_/i)
      );

      badgeFiles.sort((a, b) => {
        const ai = parseInt(a.name.split("_")[0]);
        const bi = parseInt(b.name.split("_")[0]);
        return bi - ai;
      });

      let totalXP = 0;

      achievementsEl.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.display = "flex";
      grid.style.flexWrap = "wrap";
      grid.style.justifyContent = "center";
      grid.style.gap = "1rem";
      grid.style.padding = "1rem";
      grid.style.maxWidth = "700px";
      grid.style.margin = "0 auto";

      badgeFiles.forEach((file) => {
        const xpMatch = file.name.match(/_(\d+)xp_/i);
        if (!xpMatch) return;

        const xp = parseInt(xpMatch[1]);
        totalXP += xp;

        let namePart = file.name
          .replace(/\.png$/i, "");
        const lvlMatch = namePart.match(/(?:_|-)lvl(\d+)/i);
        const level = lvlMatch ? parseInt(lvlMatch[1]) : 1;
        if (lvlMatch) {
          namePart = namePart.replace(lvlMatch[0], "");
        }

        const rawTitle = namePart.replace(/[_\-]/g, " ").trim();
        const displayTitle = `${rawTitle.toUpperCase()} - ${xp} XP - Level ${level}`;

        const img = document.createElement("img");
        img.src = file.download_url;
        img.alt = displayTitle;
        img.title = displayTitle;
        img.className = "achievement";
        img.dataset.title = rawTitle;
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

      fetch(`xp.json?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          updateDisplay({
            xp: totalXP,
            leaderboard: data.leaderboard || [],
          });
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
setInterval(fetchAndUpdate, 10000);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".achievement")) {
    if (activeAchievement) {
      activeAchievement.classList.remove("active");
      activeAchievement = null;
    }
    hideBadgeTooltip();
  }
});
