// .github/scripts/update-xp.js
const fs = require("fs");
const path = require("path");

const xpPath = path.join(__dirname, "../../docs/xp.json");
const payloadPath = process.env.GITHUB_EVENT_PATH;
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));

if (!payload.issue || payload.issue.state !== "closed") {
  console.log("No closed issue detected.");
  process.exit(0);
}

const issue = payload.issue;
const assignee = issue.assignee?.login;
const body = issue.body || "";
const xpMatch = body.match(/XP:\s*(\d+)/i);
const xpAmount = xpMatch ? parseInt(xpMatch[1]) : 0;

if (!assignee || !xpAmount) {
  console.log("Missing assignee or XP value.");
  process.exit(0);
}

let xpData = { xp: 0, recent: [], badges: [] };
if (fs.existsSync(xpPath)) {
  xpData = JSON.parse(fs.readFileSync(xpPath, "utf8"));
}

xpData.xp += xpAmount;

xpData.recent = xpData.recent || [];
xpData.recent.unshift({ user: assignee, title: issue.title, xp: xpAmount });
if (xpData.recent.length > 5) {
  xpData.recent.pop();
}

fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
console.log(`✅ Added ${xpAmount} XP to ${assignee}`);
