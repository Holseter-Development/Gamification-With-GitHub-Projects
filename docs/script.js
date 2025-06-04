let previousXP = 0;
let previousLevel = 0;
let hasInteracted = false;

const levelEl = document.getElementById("level");
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const leaderboardEl = document.getElementById("leaderboard");
const achievementsEl = document.getElementById("achievements");

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
  let current = 0;
  const increment = Math.ceil(currentXP / 120);

  const animate = () => {
    current += increment;
    if (current > currentXP) current = currentXP;
    xpBar.value = current;
    xpText.textContent = `${current} / ${xpToNext} XP`;

    if (current < currentXP) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

function loadAchievementsAndXP() {
  fetch(
    "https://api.github.com/repos/JoachimHolseterBouvet/Gamification-With-GitHub-Projects/contents/docs/achievements"
  )
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
        const match = file.name.match(/^\d+_(\d+)xp_([\w\-]+)\.png$/i);
        if (!match) return;

        const xp = parseInt(match[1]);
        totalXP += xp;

        const rawTitle = match[2].replace(/[_\-]/g, " ").toUpperCase();
        const displayTitle = `${rawTitle} - ${xp}XP`;

        const img = document.createElement("img");
        img.src = file.download_url;
        img.alt = displayTitle;
        img.title = displayTitle;
        img.style.width = "128px";
        img.style.height = "128px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.3)";
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
  previousLevel = progress.level;
  previousXP = progress.totalXP;
}

fetchAndUpdate = loadAchievementsAndXP;
fetchAndUpdate();
setInterval(fetchAndUpdate, 10000);
