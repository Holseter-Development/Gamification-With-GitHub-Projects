fetch("xp.json")
  .then((res) => res.json())
  .then((data) => {
    const levelEl = document.getElementById("level");
    const xpBar = document.getElementById("xpBar");
    const xpText = document.getElementById("xpText");
    const leaderboardEl = document.getElementById("leaderboard");

    if (!levelEl || !xpBar || !xpText || !leaderboardEl) return;

    levelEl.textContent = data.level;

    // Animate XP bar value
    let current = 0;
    const increment = Math.ceil(data.xp / 40); // 40 frames

    const animateXP = () => {
      current += increment;
      if (current > data.xp) current = data.xp;
      xpBar.value = current;
      xpText.textContent = `${current} / ${data.xpToNext} XP`;
      if (current < data.xp) requestAnimationFrame(animateXP);
    };

    animateXP();

    data.leaderboard
      .sort((a, b) => b.xp - a.xp)
      .forEach((entry) => {
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
      });
  });
