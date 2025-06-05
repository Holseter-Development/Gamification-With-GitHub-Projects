const fs = require('fs');
const path = require('path');

const xpPath = path.join(__dirname, '../../docs/xp.json');
const badgesDir = path.join(__dirname, '../../docs/achievements');

let xpData = { xp: 0, leaderboard: [] };
if (fs.existsSync(xpPath)) {
  xpData = JSON.parse(fs.readFileSync(xpPath, 'utf8'));
}

const existingBadgeXP = (xpData.badges || []).reduce((sum, b) => sum + (b.xp || 0), 0);
const baseXP = xpData.xp - existingBadgeXP;

const files = fs.readdirSync(badgesDir).filter(f => f.toLowerCase().endsWith('.png'));
files.sort((a, b) => {
  const ai = parseInt(a.split('_')[0]);
  const bi = parseInt(b.split('_')[0]);
  return ai - bi;
});

const badges = [];
let badgeTotal = 0;
for (const file of files) {
  const xpMatch = file.match(/_(\d+)xp_/i);
  const xp = xpMatch ? parseInt(xpMatch[1]) : 0;
  const lvlMatch = file.match(/(?:_|-)lvl(\d+)/i);
  const level = lvlMatch ? parseInt(lvlMatch[1]) : 1;
  let namePart = file.replace(/\.png$/i, '');
  if (lvlMatch) namePart = namePart.replace(lvlMatch[0], '');
  namePart = namePart.replace(/^[0-9]+_/, '');
  const title = namePart
    .replace(/_(\d+)xp_?/i, '')
    .replace(/[_-]/g, ' ')
    .trim();

  badges.push({ file, title, xp, level });
  badgeTotal += xp;
}

xpData.badges = badges;
xpData.xp = baseXP + badgeTotal;

fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2) + '\n');
console.log(`Updated xp.json with ${badges.length} badges and total XP ${xpData.xp}`);

