let previousXP = 0;
let previousLevel = 1;
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
  let level = 1;
  let required = 100;
  let remaining = xp;

  while (remaining >= required) {
    remaining -= required;
    required = Math.round((required * 1.25) / 10) * 10;
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

function loadAchievements() {
  fetch(`achievements/index.json?t=${Date.now()}`)
    .then((res) => res.json())
    .then((files) => {
      if (!achievementsEl) return;
      achievementsEl.innerHTML = "";

      const grid = document.createElement("div");
      grid.style.display = "flex";
      grid.style.flexWrap = "wrap";
      grid.style.justifyContent = "center";
      grid.style.gap = "1rem";
      grid.style.padding = "1rem";
      grid.style.maxWidth = "700px";
      grid.style.margin = "0 auto";

      files.forEach((filename) => {
        const img = document.createElement("img");
        img.src = `achievements/${filename}`;
        img.alt = filename;
        img.style.width = "128px";
        img.style.height = "128px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.3)";
        grid.appendChild(img);
      });

      achievementsEl.appendChild(grid);
    });
}

function updateDisplay(data) {
  const progress = calculateLevel(data.xp);
  if (!levelEl || !xpBar || !xpText || !leaderboardEl) return;

  const leveledUp = progress.level > previousLevel;

  if (leveledUp && hasInteracted) {
    levelUpSound.play();
    const previousMax = Math.round(progress.xpToNext / 1.25 / 10) * 10;
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

  previousLevel = progress.level;
  previousXP = progress.totalXP;

  leaderboardEl.innerHTML = "";
  let topXP = -1;

  data.leaderboard
    .sort((a, b) => b.xp - a.xp)
    .forEach((entry, index) => {
      const li = document.createElement("li");
      const avatar = document.createElement("img");
      avatar.src = `https://github.com/${entry.user}.png`;
      avatar.alt = entry.user;
      avatar.width = 48;
      avatar.height = 48;

      const text = document.createElement("span");
      text.textContent = `@${entry.user} - ${entry.xp} XP`;

      li.appendChild(avatar);
      li.appendChild(text);

      leaderboardEl.appendChild(li);

      if (index === 0 && entry.xp > topXP && hasInteracted) {
        setTimeout(() => {
          coinSound.play();
        }, 1000);
      }

      if (entry.xp > topXP) {
        topXP = entry.xp;
      }
    });
}

function fetchAndUpdate() {
  const url = `xp.json?t=${Date.now()}`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.xp !== previousXP) {
        updateDisplay(data);
      }
    });
}

fetchAndUpdate();
setInterval(fetchAndUpdate, 10000);
loadAchievements();
