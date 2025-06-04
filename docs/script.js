let previousXP = 0;
let previousLevel = 0;
let hasInteracted = false;

const levelEl = document.getElementById("level");
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const leaderboardEl = document.getElementById("leaderboard");
const achievementsEl = document.getElementById("achievements");
const contributionLogEl = document.getElementById("contributionLog");

const levelUpSound = new Audio("sounds/level-up.mp3");
const coinSound = new Audio("sounds/coin.mp3");

let config = {
  showLeaderboard: true,
  showContributionLog: false,
  showBadges: true,
  enableConfetti: true,
  playsoundEffects: true,
  refreshInterval: 10000,
  xpLevelMultiplier: 1.1,
};

window.addEventListener("click", () => {
  hasInteracted = true;
});

function calculateLevel(xp) {
  let level = 0;
  let required = 200;
  let remaining = xp;

  while (remaining >= required) {
    remaining -= required;
    required = Math.round((required * config.xpLevelMultiplier) / 10) * 10;
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

function updateVisibility() {
  if (leaderboardEl)
    leaderboardEl.style.display = config.showLeaderboard ? "block" : "none";
  if (contributionLogEl)
    contributionLogEl.style.display = config.showContributionLog
      ? "block"
      : "none";
  if (achievementsEl)
    achievementsEl.style.display = config.showBadges ? "block" : "none";
}

function loadAchievementsAndXP() {
  fetch("./config.json")
    .then((res) => res.json())
    .then((cfg) => {
      config = cfg;
      updateVisibility();
      return Promise.all([
        fetch("./xp.json").then((res) => res.json()),
        fetch(
          "https://api.github.com/repos/JoachimHolseterBouvet/Gamification-With-GitHub-Projects/contents/docs/achievements"
        ).then((res) => res.json()),
      ]);
    })
    .then(([xpData, badgeFiles]) => {
      if (!Array.isArray(badgeFiles)) badgeFiles = [];

      const parsedBadges = badgeFiles.filter((f) =>
        f.name.match(/\d+_(\d+)xp_([\w\-]+)\.png/i)
      );

      parsedBadges.sort((a, b) => {
        const ai = parseInt(a.name.split("_")[0]);
        const bi = parseInt(b.name.split("_")[0]);
        return bi - ai;
      });

      const badgeContributions = parsedBadges.map((file) => {
        const match = file.name.match(/\d+_(\d+)xp_([\w\-]+)\.png/i);
        const xp = parseInt(match[1]);
        const title = match[2].replace(/[_\-]/g, " ").toUpperCase();
        return {
          user: "team",
          action: "earned",
          title,
          xp,
          image: file.download_url,
        };
      });

      achievementsEl.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.display = "flex";
      grid.style.flexWrap = "wrap";
      grid.style.justifyContent = "center";
      grid.style.gap = "1rem";
      grid.style.padding = "1rem";
      grid.style.maxWidth = "700px";
      grid.style.margin = "0 auto";

      badgeContributions.forEach((entry) => {
        const img = document.createElement("img");
        img.src = entry.image;
        img.alt = entry.title;
        img.title = `${entry.title} - ${entry.xp}XP`;
        img.style.width = "128px";
        img.style.height = "128px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.3)";
        grid.appendChild(img);
      });

      achievementsEl.appendChild(grid);

      const contributions = [
        ...(xpData.contributions || []),
        ...badgeContributions,
      ];

      updateDisplay({
        xp: xpData.xp,
        leaderboard: xpData.leaderboard,
        contributions,
      });
    });
}

function updateDisplay(data) {
  const progress = calculateLevel(data.xp);
  const leveledUp = progress.level > previousLevel;

  if (leveledUp && hasInteracted && config.enableConfetti) {
    if (config.playsoundEffects) levelUpSound.play();
    const previousMax =
      Math.round(progress.xpToNext / config.xpLevelMultiplier / 10) * 10;
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

  if (config.showContributionLog && Array.isArray(data.contributions)) {
    contributionLogEl.innerHTML = "<ul></ul>";
    const ul = contributionLogEl.querySelector("ul");
    data.contributions
      .slice(-5)
      .reverse()
      .forEach((entry, index) => {
        const li = document.createElement("li");
        if (index === 4) li.style.opacity = "0.5";

        if (entry.image) {
          const img = document.createElement("img");
          img.src = entry.image;
          img.alt = entry.title;
          img.width = 32;
          img.height = 32;
          img.style.marginRight = "0.5rem";
          li.appendChild(img);
        }

        const text = document.createElement("span");
        text.textContent = `✅ ${entry.user} ${entry.action} "${entry.title}" - ${entry.xp}XP`;
        li.appendChild(text);

        ul.appendChild(li);
      });
  }

  if (config.showLeaderboard && Array.isArray(data.leaderboard)) {
    leaderboardEl.innerHTML = "<ul></ul>";
    const ul = leaderboardEl.querySelector("ul");
    data.leaderboard
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5)
      .forEach((entry, index) => {
        const li = document.createElement("li");
        if (index === 4) li.style.opacity = "0.5";

        const avatar = document.createElement("img");
        avatar.src = `https://github.com/${entry.user}.png`;
        avatar.alt = entry.user;
        avatar.width = 48;
        avatar.height = 48;
        li.appendChild(avatar);

        const text = document.createElement("span");
        text.textContent = `@${entry.user} - ${entry.xp} XP`;
        li.appendChild(text);

        ul.appendChild(li);
      });
  }
}

fetchAndUpdate = loadAchievementsAndXP;
fetchAndUpdate();
setInterval(fetchAndUpdate, config.refreshInterval);
