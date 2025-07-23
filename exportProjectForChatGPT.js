const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "chatgpt_project_dump.txt";
const ROOT_DIR = ".";

const EXTENSIONS = [".jsx", ".js", ".json", ".css", ".html", ".ts", ".tsx"];
const IGNORE = ["node_modules", "dist", ".git", ".vercel", "package-lock.json", "chatgpt_project_dump.txt"];

function walk(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !IGNORE.includes(file)) {
      walk(fullPath, fileList);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(file))) {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

function exportForChatGPT() {
  const files = walk(ROOT_DIR);
  const output = files
    .map(f => {
      const content = fs.readFileSync(f, "utf8");
      return `\n\n// === FILE: ${f} ===\n\n${content}`;
    })
    .join("\n");

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Ready for ChatGPT: ${files.length} files in ${OUTPUT_FILE}`);
}

exportForChatGPT();
