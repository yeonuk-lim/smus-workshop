// CopilotKit 1.57+ web-inspector 배너/인스펙터 제거 패치 (파일명 독립)
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "node_modules", "@copilotkit", "react-core", "dist");
if (!fs.existsSync(distDir)) process.exit(0);

let patched = 0;
for (const f of fs.readdirSync(distDir)) {
  if (!/\.(mjs|cjs)$/.test(f)) continue;
  const file = path.join(distDir, f);
  let code = fs.readFileSync(file, "utf8");
  const before = code;

  // web-inspector 동적 import를 no-op으로
  code = code.replace(/import\(\s*["']@copilotkit\/web-inspector["']\s*\)/g, "Promise.resolve({ default: {} })");

  if (code !== before) {
    fs.writeFileSync(file, code);
    patched++;
  }
}
console.log(`✅ CopilotKit web-inspector patched (${patched} file(s))`);
