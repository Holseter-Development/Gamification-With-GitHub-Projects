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
    required = Math.ceil(required * 1.25);
    level++;
  }

  return {
    level,
    currentXP: remaining,
    xpToNext: required,
    totalXP: xp,
  };
}

function loadAchievements() {
  fetch("achievements/index.json")
    .then((res) => res.json())
    .then((files) => {
      if (!achievementsEl) return;
      achievementsEl.innerHTML = "";

      for (let i = 0; i < files.length; i += 5) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "center";
        row.style.gap = "1rem";
        row.style.marginBottom = "1rem";

        files.slice(i, i + 5).forEach((filename) => {
          const img = document.createElement("img");
          img.src = `achievements/${filename}`;
          img.alt = filename;
          img.style.width = "100px";
          img.style.height = "100px";
          img.style.objectFit = "cover";
          img.style.borderRadius = "12px";
          img.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.3)";
          row.appendChild(img);
        });

        achievementsEl.appendChild(row);
      }
    });
}

function updateDisplay(data) {
  const progress = calculateLevel(data.xp);

  if (!levelEl || !xpBar || !xpText || !leaderboardEl) return;

  if (progress.level > previousLevel && hasInteracted) {
    levelUpSound.play();
    let confettiCount = 0;
    const confettiInterval = setInterval(() => {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      confettiCount++;
      if (confettiCount >= 10) clearInterval(confettiInterval);
    }, 1000);

    setTimeout(() => {
      xpBar.value = 0;
      xpText.textContent = `0 / ${progress.xpToNext} XP`;
    }, 10000);
  }

  previousLevel = progress.level;
  previousXP = progress.totalXP;

  levelEl.textContent = progress.level;
  xpBar.max = progress.xpToNext;

  let current = 0;
  const increment = Math.ceil(progress.currentXP / 120);

  const animateXP = () => {
    current += increment;
    if (current > progress.currentXP) current = progress.currentXP;
    xpBar.value = current;
    xpText.textContent = `${current} / ${progress.xpToNext} XP`;

    if (current < progress.currentXP) {
      requestAnimationFrame(animateXP);
    }
  };

  animateXP();

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
  fetch("xp.json")
    .then((res) => res.json())
    .then((data) => {
      if (data.xp !== previousXP) {
        updateDisplay(data);
      }
    });
}

fetchAndUpdate();
setInterval(fetchAndUpdate, 30000);
loadAchievements();
