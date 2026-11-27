// 커버리지 표(마크다운). coverage/coverage-summary.json(vitest --coverage)을 읽어 전체와 로직 계층(lib·model·api) 값을 보여 줍니다.
// GitHub Actions에서는 $GITHUB_STEP_SUMMARY에 쓰고, 로컬에서는 화면에 찍습니다.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";

const SUMMARY = "coverage/coverage-summary.json";
const METRICS = ["lines", "statements", "functions", "branches"];
const LABELS = { lines: "줄", statements: "문장", functions: "함수", branches: "분기" };
const LOGIC = /^src\/.*\/(lib|model|api)\//;

if (!existsSync(SUMMARY)) {
  console.error(`${SUMMARY}가 없습니다. 먼저 pnpm test:coverage를 돌립니다.`);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(SUMMARY, "utf8"));
const logic = Object.fromEntries(METRICS.map((metric) => [metric, { covered: 0, total: 0 }]));
const files = [];
for (const [file, value] of Object.entries(summary)) {
  if (file === "total") continue;
  const path = relative(process.cwd(), file);
  if (!LOGIC.test(path)) continue;
  for (const metric of METRICS) {
    logic[metric].covered += value[metric].covered;
    logic[metric].total += value[metric].total;
  }
  if (value.lines.total > 0) files.push({ path, pct: value.lines.pct, total: value.lines.total });
}

const pct = ({ covered, total }) => (total === 0 ? 100 : (100 * covered) / total).toFixed(2);
const lines = [
  "## 커버리지",
  "",
  `| 범위 | ${METRICS.map((metric) => LABELS[metric]).join(" | ")} |`,
  `| --- | ${METRICS.map(() => "---:").join(" | ")} |`,
  `| 전체 | ${METRICS.map((metric) => `${pct(summary.total[metric])}%`).join(" | ")} |`,
  `| 로직 계층(lib·model·api) | ${METRICS.map((metric) => `${pct(logic[metric])}%`).join(" | ")} |`,
  "",
  "기준: 로직 계층 80%, 전체는 기준선 아래로 못 내려감(`vitest.config.ts`의 `coverage.thresholds`).",
  "",
  "<details><summary>로직 계층에서 줄 커버리지가 낮은 파일 10개</summary>",
  "",
  "| 파일 | 줄 | 줄 수 |",
  "| --- | ---: | ---: |",
  ...files
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 10)
    .map(({ path, pct: value, total }) => `| \`${path}\` | ${value}% | ${total} |`),
  "",
  "</details>",
  "",
];

const text = lines.join("\n");
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
else console.log(text);
