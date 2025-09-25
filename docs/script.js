// =========================================
// --- Script to power the gamification dashboard ---
// =========================================

// =========================================
// --- Theming & Assets ---
// =========================================
// You can replace these with your own team's sounds
const levelUpSound = new Audio("sounds/level-up.mp3");
const achievementSound = new Audio("sounds/achievement.mp3");

// =========================================
// --- Dashboard Rendering Functions ---
// =========================================

/**
 * Calculates the team's current level based on total XP.
 * @param {number} totalXP The total experience points of the team.
 * @returns {number} The current level.
 */
function calculateLevel(totalXP) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Calculates XP needed for the next level.
 * @param {number} currentLevel The current level of the team.
 * @returns {number} The XP required for the next level.
 */
function xpForNextLevel(currentLevel) {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * Renders the main dashboard elements: XP, level, and XP bar.
 * @param {object} data The data object fetched from xp.json.
 */
function renderHeader(data) {
  const totalXP = data.totalXP || 0;
  const currentLevel = calculateLevel(totalXP);
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = totalXP - xpForNextLevel(currentLevel - 1);
  const xpPercentage =
    (xpProgress / (xpNeeded - xpForNextLevel(currentLevel - 1))) * 100;

  document.getElementById("level-number").textContent = currentLevel;
  const xpBar = document.getElementById("xp-bar");
  xpBar.style.width = xpPercentage + "%";
  xpBar.textContent = `${totalXP} / ${xpNeeded} XP`;
}

/**
 * Renders the dynamic team stats grid.
 * @param {object} teamStats The teamStats object from xp.json.
 */
function renderTeamStats(teamStats) {
  const statsContainer = document.getElementById("team-stats-grid");
  statsContainer.innerHTML = ""; // Clear previous stats

  const statsData = [
    { label: "Bugs Squashed", value: teamStats.bugsClosedCount, icon: "🐞" },
    {
      label: "User Stories Closed",
      value: teamStats.userStoriesClosedCount,
      icon: "✨",
    },
    {
      label: "Avg. Issue Open Time",
      value: teamStats.avgIssueOpenTimeHours.toFixed(1) + "h",
      icon: "⏱️",
    },
    {
      label: "Fastest Bug Close",
      value: teamStats.fastestBugCloseTimeHours.toFixed(1) + "h",
      icon: "⚡",
    },
    {
      label: "Quality Score",
      value: teamStats.qualityScore.toFixed(0) + "%",
      icon: "💯",
    },
  ];

  statsData.forEach((stat) => {
    const statBox = document.createElement("div");
    statBox.className = "stat-box animate__animated animate__zoomIn";
    statBox.innerHTML = `
            <span class="icon">${stat.icon}</span>
            <span class="value">${stat.value}</span>
            <span class="label">${stat.label}</span>
        `;
    statsContainer.appendChild(statBox);
  });
}

/**
 * Renders the recent team activity feed.
 * @param {Array} activityLog The recentActivity array from xp.json.
 */
function renderRecentActivity(activityLog) {
  const activityList = document.getElementById("activity-list");
  activityList.innerHTML = ""; // Clear previous activity

  activityLog.forEach((entry) => {
    const listItem = document.createElement("li");
    // Simple emojis based on issue type
    const icon = entry.issueType === "Bug" ? "🐞" : "✨";
    listItem.innerHTML = `
            <span class="activity-icon">${icon}</span>
            <span><b>${
              entry.user
            }</b> closed a <b>${entry.issueType.toLowerCase()}</b>: "${
      entry.issueTitle
    }"</span>
        `;
    activityList.appendChild(listItem);
  });
}

/**
 * Renders the team achievements.
 * @param {Array} badges The badges array from xp.json.
 */
function renderAchievements(badges) {
  const achievementsList = document.getElementById("achievements");
  achievementsList.innerHTML = ""; // Clear previous badges

  badges.forEach((badge) => {
    const listItem = document.createElement("li");
    listItem.className = "animate__animated animate__fadeInUp";
    listItem.innerHTML = `
            <img src="achievements/${badge.file}" alt="${badge.title}">
            <h4>${badge.title}</h4>
        `;
    achievementsList.appendChild(listItem);
  });
}

/**
 * Main function to fetch data and update the dashboard.
 */
async function fetchAndUpdate() {
  try {
    const response = await fetch("xp.json?" + new Date().getTime());
    const data = await response.json();

    renderHeader(data);
    renderTeamStats(data.teamStats);
    renderRecentActivity(data.recentActivity);
    renderAchievements(data.badges);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }
}

// =========================================
// --- Initialization & Event Listeners ---
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  fetchAndUpdate();
  // Refresh every 30 seconds
  setInterval(fetchAndUpdate, 30000);
});
