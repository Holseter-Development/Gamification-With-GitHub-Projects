// update-xp.js
const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "JoachimHolseterBouvet";
const REPO_NAME = "Gamification-With-GitHub-Projects";
const XP_FILE_PATH = "docs/xp.json";
const ACHIEVEMENTS_DIR = "docs/achievements";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getIssues() {
  const issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: "closed",
    per_page: 100,
  });
  return issues;
}

function parseXPFromIssue(body) {
  const match = body.match(/XP:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

function parseBadgesFromFilenames(filenames) {
  return filenames
    .map((file) => {
      const match = file.name.match(/\d+_(\d+)xp_([\w\-]+)\.png/i);
      if (!match) return null;
      const xp = parseInt(match[1]);
      const title = match[2].replace(/[_\-]/g, " ").toUpperCase();
      return {
        title,
        xp,
        image: file.download_url,
        timestamp: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

async function getAchievementsFromRepo() {
  const response = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: ACHIEVEMENTS_DIR,
  });
  return Array.isArray(response.data) ? response.data : [];
}

async function updateXP() {
  const issues = await getIssues();
  const xpData = fs.existsSync(XP_FILE_PATH)
    ? JSON.parse(fs.readFileSync(XP_FILE_PATH, "utf8"))
    : { xp: 0, leaderboard: [], contributions: [], badges: [] };

  const processedIssues = new Set(
    xpData.contributions.filter((c) => c.type === "issue").map((c) => c.title)
  );
  const processedBadges = new Set(
    xpData.badges.map((b) => b.title + b.xp) // crude uniqueness
  );

  for (const issue of issues) {
    if (!issue.body || processedIssues.has(issue.title)) continue;

    const xp = parseXPFromIssue(issue.body);
    if (!xp) continue;

    xpData.xp += xp;
    const user = issue.user.login;

    let existingUser = xpData.leaderboard.find((u) => u.user === user);
    if (existingUser) {
      existingUser.xp += xp;
    } else {
      xpData.leaderboard.push({ user, xp });
    }

    xpData.contributions.push({
      user,
      title: issue.title,
      xp,
      timestamp: new Date().toISOString(),
      type: "issue",
    });
  }

  const badgeFiles = await getAchievementsFromRepo();
  const newBadges = parseBadgesFromFilenames(badgeFiles).filter(
    (b) => !processedBadges.has(b.title + b.xp)
  );

  for (const badge of newBadges) {
    xpData.xp += badge.xp;
    xpData.badges.push(badge);
    xpData.contributions.push({
      user: "team",
      action: "earned",
      title: badge.title,
      xp: badge.xp,
      image: badge.image,
      timestamp: badge.timestamp,
      type: "badge",
    });
  }

  fs.writeFileSync(XP_FILE_PATH, JSON.stringify(xpData, null, 2));
  console.log("XP updated successfully.");
}

updateXP().catch((error) => {
  console.error("Error updating XP:", error);
  process.exit(1);
});
