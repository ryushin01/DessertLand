/**
 * 한중일 웹 글꼴 복사: `pnpm install`의 prepare 단계에서 자동으로 돌고, 직접 돌릴 때는 `node scripts/copy-cjk-fonts.mjs`.
 *
 * 외부 글꼴 서버(Google Fonts) 없이도 같은 글꼴로 보이도록, Fontsource 패키지(OFL)의 CSS와 woff2를
 * `public/fonts/cjk/`로 복사해 언어별 CSS(`ko.css`·`ja.css`·`zh.css`)를 만듭니다. 파일이 커서 저장소에 넣지 않고
 * 설치할 때 만듭니다(.gitignore). 글꼴은 Google Fonts와 같은 글자 묶음으로 나뉘어 있어, 브라우저는 화면에 쓴 글자가 든
 * 조각만 받습니다. 한국어 본문(하다 바탕)은 `pnpm fonts`가 따로 만듭니다.
 */
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/fonts/cjk");
const require = createRequire(import.meta.url);

/** 언어마다 받을 글꼴과 굵기. LocaleLayout의 CJK_FONTS와 맞춥니다. */
const LOCALES = {
  ko: [["@fontsource/grandiflora-one", [400]]],
  ja: [
    ["@fontsource/zen-maru-gothic", [400, 500, 700]],
    ["@fontsource/kaisei-decol", [500]],
  ],
  zh: [
    ["@fontsource/noto-sans-sc", [400, 500, 700]],
    ["@fontsource/noto-serif-sc", [500]],
  ],
};

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, "files"), { recursive: true });

for (const [locale, fonts] of Object.entries(LOCALES)) {
  const blocks = [];
  for (const [pkg, weights] of fonts) {
    const dir = path.dirname(require.resolve(`${pkg}/package.json`));
    for (const weight of weights) {
      const source = await readFile(path.join(dir, `${weight}.css`), "utf8");
      // woff2만 남기고(woff 대체 파일은 버림) 파일 경로를 복사한 위치로 바꿉니다.
      const css = source.replace(
        /src: url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\)(?:, url\([^)]+\) format\('woff'\))?/g,
        (_, file) => `src: url(./files/${file}) format('woff2')`,
      );
      for (const [, file] of css.matchAll(/url\(\.\/files\/([^)]+\.woff2)\)/g)) {
        await copyFile(path.join(dir, "files", file), path.join(OUT, "files", file));
      }
      blocks.push(css);
    }
  }
  await writeFile(path.join(OUT, `${locale}.css`), blocks.join("\n"));
}

console.log(`한중일 글꼴을 ${path.relative(ROOT, OUT)}에 복사했습니다.`);
