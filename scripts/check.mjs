// CI와 같은 검사를 한 번에 돌립니다. CI(.github/workflows/ci.yml)도 이 스크립트를 단계별로 부릅니다.
//   pnpm check                     정적 검사 → 빌드 → 번들 예산 → E2E → Lighthouse (CI 전체와 같음)
//   pnpm check static              typecheck · lint · lint:fsd · 단위 테스트와 커버리지
//   pnpm check build size          빌드와 번들 예산
//   pnpm check e2e -- --shard=1/2  E2E(Playwright에 넘길 인자는 -- 뒤에)
//   pnpm check lhci                Lighthouse(먼저 build)
import { spawnSync } from "node:child_process";

const STEPS = {
  static: [
    ["typecheck"],
    ["lint"],
    ["lint:fsd"],
    ["test:coverage"],
    // 커버리지 표: CI에서는 $GITHUB_STEP_SUMMARY, 로컬에서는 화면
    ["exec", "node", "scripts/coverage-summary.mjs"],
  ],
  // 운영과 같은 공개 데모 빌드로 E2E·번들 예산을 봅니다(값이 없을 때와 같지만 CI와 맞추려고 적어 둠).
  build: [["build"]],
  size: [["size"]],
  e2e: [["e2e"]],
  // 리포트는 공개 저장소에 올리지 않고 .lighthouseci/reports에 둡니다(CI는 실패할 때만 결과물로 올림).
  lhci: [["lhci", "--upload.target=filesystem", "--upload.outputDir=.lighthouseci/reports"]],
};
const ORDER = ["static", "build", "size", "e2e", "lhci"];

const args = process.argv.slice(2);
const split = args.indexOf("--");
const names = (split === -1 ? args : args.slice(0, split)).filter((name) => name !== "");
const extra = split === -1 ? [] : args.slice(split + 1);
const groups = names.length === 0 ? ORDER : names;

const unknown = groups.filter((name) => !(name in STEPS));
if (unknown.length > 0) {
  console.error(`모르는 검사: ${unknown.join(", ")} (가능: ${ORDER.join(", ")})`);
  process.exit(1);
}

const env = { ...process.env, NEXT_PUBLIC_DEMO: process.env.NEXT_PUBLIC_DEMO ?? "1" };
const timings = [];
for (const group of ORDER.filter((name) => groups.includes(name))) {
  for (const step of STEPS[group]) {
    const command = step[0] === "exec" ? step : ["run", ...step, ...(group === "e2e" ? extra : [])];
    const label = `pnpm ${command.join(" ")}`;
    console.log(`\n▶ ${label}`);
    const started = Date.now();
    const result = spawnSync("pnpm", command, {
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    });
    const seconds = Math.round((Date.now() - started) / 1000);
    timings.push(`${result.status === 0 ? "✓" : "✗"} ${label} (${seconds}초)`);
    if (result.status !== 0) {
      console.error(`\n${timings.join("\n")}\n\n실패: ${label}`);
      process.exit(result.status ?? 1);
    }
  }
}
console.log(`\n${timings.join("\n")}\n\n모든 검사를 통과했습니다.`);
