const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const token = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: token });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issueNumber = process.env.ISSUE_NUMBER;

const xpFilePath = path.join(__dirname, "../../docs/xp.json");

// Define XP values for different work types
const XP_VALUES = {
  bug: 25,
  feature: 50,
  "user-story": 50,
  documentation: 20,
  refactor: 30,
};

// =========================================
// --- Helper Functions ---
// =========================================

/**
 * Reads the current xp.json file.
 * @returns {object} The parsed JSON data.
 */
function readXPFile() {
  if (fs.existsSync(xpFilePath)) {
    const fileContent = fs.readFileSync(xpFilePath, "utf8");
    return JSON.parse(fileContent);
  }
  return { totalXP: 0, teamStats: {}, recentActivity: [], badges: [] };
}

/**
 * Writes the updated data back to the xp.json file.
 * @param {object} data The data to write.
 */
function writeXPFile(data) {
  fs.writeFileSync(xpFilePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Calculates time in hours between two date strings.
 * @param {string} start The start date string.
 * @param {string} end The end date string.
 * @returns {number} The difference in hours.
 */
function calculateHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate - startDate) / (1000 * 60 * 60);
}

// =========================================
// --- Main Script Execution ---
// =========================================

async function updateDashboardData() {
  try {
    const { data: issue } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    // Determine issue type from labels
    const issueType = issue.labels
      .find((label) => XP_VALUES[label.name.toLowerCase()])
      ?.name.toLowerCase();
    if (!issueType) {
      console.log(
        `Issue #${issueNumber} has no relevant labels. No XP awarded.`
      );
      return;
    }

    const xpToAward = XP_VALUES[issueType] || 0;
    const xpData = readXPFile();

    // 1. Update Total Team XP
    xpData.totalXP += xpToAward;
    console.log(`Awarded ${xpToAward} XP to the team.`);

    // 2. Update Team Stats
    const hoursToClose = calculateHours(issue.created_at, issue.closed_at);

    if (!xpData.teamStats) {
      xpData.teamStats = {
        bugsClosedCount: 0,
        userStoriesClosedCount: 0,
        avgIssueOpenTimeHours: 0,
        fastestBugCloseTimeHours: 99999,
        qualityScore: 0,
      };
    }

    if (issueType === "bug") {
      xpData.teamStats.bugsClosedCount =
        (xpData.teamStats.bugsClosedCount || 0) + 1;
      if (hoursToClose < xpData.teamStats.fastestBugCloseTimeHours) {
        xpData.teamStats.fastestBugCloseTimeHours = hoursToClose;
      }
    } else if (issueType === "user-story" || issueType === "feature") {
      xpData.teamStats.userStoriesClosedCount =
        (xpData.teamStats.userStoriesClosedCount || 0) + 1;
    }

    // Recalculate average issue time (simple average for this example)
    const totalClosedIssues =
      xpData.teamStats.bugsClosedCount +
      xpData.teamStats.userStoriesClosedCount;
    if (totalClosedIssues > 0) {
      xpData.teamStats.avgIssueOpenTimeHours =
        (xpData.teamStats.avgIssueOpenTimeHours * (totalClosedIssues - 1) +
          hoursToClose) /
        totalClosedIssues;
    }

    // 3. Update Recent Activity Feed
    const newActivity = {
      user: issue.closed_by.login,
      action: "closed",
      issueTitle: issue.title,
      issueType: issueType.charAt(0).toUpperCase() + issueType.slice(1),
      timestamp: new Date().toISOString(),
    };

    xpData.recentActivity.unshift(newActivity); // Add to the beginning of the array
    if (xpData.recentActivity.length > 15) {
      // Cap the feed at 15 items
      xpData.recentActivity.pop();
    }

    writeXPFile(xpData);
    console.log("Successfully updated dashboard data.");
  } catch (error) {
    console.error("Failed to update dashboard data:", error);
    process.exit(1);
  }
}

updateDashboardData();
