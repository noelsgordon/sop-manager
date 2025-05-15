const fs = require("fs");
const path = require("path");

const versionPath = path.join(__dirname, "../version.json");
const isMajor = process.argv.includes("major");

if (!fs.existsSync(versionPath)) {
  console.error("❌ version.json not found");
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
let [major, minor] = versionData.version.split(".").map(Number);

if (isMajor) {
  major += 1;
  minor = 0;
} else {
  minor += 1;
}

const newVersion = `${major}.${minor}`;
fs.writeFileSync(versionPath, JSON.stringify({ version: newVersion }, null, 2));

console.log(`✅ Version updated to v${newVersion}`);
