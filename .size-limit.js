// 번들 예산(pnpm size). 어드민(/admin)은 쇼핑몰과 따로 된 루트 레이아웃이라 청크도 따로 생깁니다.
// 빌드 결과의 라우트별 청크 목록(client-reference-manifest, build-manifest)과 청크 사이 참조(static/chunks/…)를 따라가
// "어드민에서만 닿는 청크"를 골라, 쇼핑몰 예산(전체 JS 367 kB·CSS 21 kB)에서 빼고 어드민 예산으로 따로 잽니다.
// 어디서도 닿지 않는 청크(런타임 등)는 쇼핑몰 쪽에 남겨, 예전처럼 넉넉히(보수적으로) 셉니다.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const NEXT = ".next";
const CHUNKS = join(NEXT, "static", "chunks");
const APP = join(NEXT, "server", "app");
const CHUNK_PATTERN = /static\/chunks\/[\w~.-]+\.(?:js|css)/g;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const chunkRefs = (text) =>
  new Set((text.match(CHUNK_PATTERN) ?? []).map((ref) => join(NEXT, ref)));

/** 시작 청크에서 참조를 따라 닿는 모든 청크. */
function reach(start) {
  const seen = new Set();
  const queue = [...start];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    if (file.endsWith(".js"))
      for (const ref of chunkRefs(readFileSync(file, "utf8"))) queue.push(ref);
  }
  return seen;
}

function entries() {
  const manifests = walk(APP).filter((file) =>
    /client-reference-manifest\.js$|build-manifest\.json$/.test(file),
  );
  const admin = new Set();
  const shop = new Set();
  for (const file of manifests) {
    const target = relative(APP, file).startsWith("admin") ? admin : shop;
    for (const ref of chunkRefs(readFileSync(file, "utf8"))) target.add(ref);
  }
  return { admin: reach(admin), shop: reach(shop) };
}

const all = walk(CHUNKS);
const { admin, shop } = entries();
const adminOnly = new Set([...admin].filter((file) => !shop.has(file)));
const pick = (ext, inAdmin) =>
  all.filter((file) => file.endsWith(ext) && adminOnly.has(file) === inAdmin);

// 어드민 예산: JS에는 상품 편집 화면이 고를 때만 받는 10개 언어 메시지 파일(약 120 kB)이 들어 있고,
// CSS는 대부분 한글 글꼴(Noto Serif KR·Pretendard)의 글자 범위별 @font-face 선언입니다(필요한 글자 조각만 받게 하려고).
const budgets = [
  { name: "전체 JS(쇼핑몰)", path: pick(".js", false), gzip: true, limit: "367 kB" },
  { name: "CSS(쇼핑몰)", path: pick(".css", false), gzip: true, limit: "21 kB" },
  { name: "어드민 전용 JS", path: pick(".js", true), gzip: true, limit: "210 kB" },
  { name: "어드민 전용 CSS", path: pick(".css", true), gzip: true, limit: "54 kB" },
];

export default budgets;
