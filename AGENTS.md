# 디저트 랜드(Dessert Land) — 에이전트 작업 안내

이 저장소의 규칙입니다. 자세한 내용은 `README.md`, `docs/development.md`, `CHANGELOG.md`에 있습니다. `next dev`의 자동 안내 블록은 `next.config.ts`의 `agentRules: false`로 꺼 두었으므로, 이 파일은 손으로 관리합니다.

## 1. 프로젝트 개요

- 전 세계 디저트를 10개 언어(한국어 기본, 영·일·중·프·이·스·독·포·튀르키예어)로 소개하고 판매하는 글로벌 쇼핑몰입니다. 별도 백엔드 없는 데모 프로젝트로, 결제는 실제 청구가 없는 테스트 결제입니다.
- 화면 축: 쇼핑몰(웹), 어드민(웹, `/admin`)
- 운영: https://dessert-land-ryushin01.vercel.app · 어드민: `/admin`(공개 데모 "관리자로 둘러보기") · Storybook: `/storybook/index.html` · 테스트 카드 `4242 4242 4242 4242`, 미래 만료일, 아무 CVC

## 2. 기술 스택과 구조

- Next.js 16(App Router), React 19, TypeScript 5.9, Panda CSS(쇼핑몰)·CSS Modules(어드민), zod, jotai, Wretch(HTTP, `shared/api`), next-intl, Stripe Checkout(테스트 모드), Claude API(`@anthropic-ai/sdk`, AI 추천), GSAP·Lenis·OGL, Sentry(DSN이 있을 때만), Vercel Speed Insights, Storybook 10
- Feature-Sliced Design: `_app → _pages → widgets → features → entities → shared` 순서로 위 층은 아래 층만 가져옵니다. 같은 층끼리는 가져오지 않고(필요하면 `entities/<대상>/@x/<소비자>.ts`), 슬라이스는 `index.ts`(서버 전용은 `index.server.ts`)로만 가져옵니다. Steiger(`pnpm lint:fsd`, `steiger.config.ts`)가 검사합니다.
- `src/app/[locale]/`의 라우트 파일은 `_pages`·`_app`을 다시 내보내기만 합니다. `src/proxy.ts`는 언어 라우팅입니다. 한 곳에서만 쓰는 코드는 그 슬라이스에 두고, 두 곳 이상에서 쓰면 `features`·`widgets`로 올립니다.
- GSAP은 `@/shared/lib/gsap`에서만 가져옵니다(움직임 상태 `@/shared/lib/motion`을 쓰는 곳에 GSAP이 실리지 않게).

## 3. 설치·개발 명령

- 패키지 매니저: pnpm(`packageManager` `pnpm@12.16.1`), Node.js 22(`.nvmrc`)
- `corepack enable pnpm` → `pnpm install`(`prepare`가 `panda codegen`과 한중일 글꼴 복사 `scripts/copy-cjk-fonts.mjs` → `public/fonts/cjk/`, git 제외) → `pnpm dev`(http://localhost:3000)
- 환경 변수(이름만, `.env.example` → `.env.local`): `STRIPE_SECRET_KEY`(테스트 키만), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_DEMO`(1이면 공개 데모: 어드민 둘러보기·쇼핑몰 반영), `ADMIN_PASSWORD`(데모가 꺼진 어드민 비밀번호), `NEXT_PUBLIC_SITE_URL`(도메인 연결 시), `E2E_PORT`·`BASE_URL`(테스트·스크린샷)
- `.env` 없이, 인터넷이 끊겨도 모든 화면이 내용과 함께 떠야 합니다. 결제는 키가 없거나 Stripe 세션 만들기가 실패(502·네트워크 오류)하면 내장 테스트 결제창(`POST /api/payments`)으로 바꾸고 `role="status"`로 알리며, 추천은 키가 없거나 실패·시간 초과(30초)면 규칙 기반 기본 추천("기본 추천 (AI 미사용)")입니다. 글꼴은 모두 같은 출처(Exo 2 `next/font/local`, 한중일 Fontsource 복사본, 하다 바탕 저장소 파일)이고 외부 글꼴 서버(Google Fonts)를 쓰지 않습니다. 자세한 표는 `docs/development.md`의 "오프라인·외부 서비스 대체".
- 그 밖의 명령: `pnpm storybook`, `pnpm analyze`, `pnpm fonts`, `pnpm screenshots`(Stripe 키 없이 `pnpm build && pnpm start` 뒤 `BASE_URL` 지정)
- 언어·상품을 더할 때는 `docs/development.md`의 "언어 추가"·"상품 추가" 순서를 따릅니다(메시지 파일, 통화, 맛, 사진 출처, 새 문자 체계면 `CJK_FONTS`와 `copy-cjk-fonts.mjs`의 `LOCALES`).

## 4. 검사·테스트 명령

| 명령                          | 내용                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `pnpm typecheck`              | `tsc --noEmit`                                                                 |
| `pnpm lint` / `pnpm lint:fsd` | ESLint(jsx-a11y recommended) / FSD 구조(Steiger)                               |
| `pnpm test`                   | 단위(Vitest + Testing Library)                                                 |
| `pnpm build`                  | `panda codegen` → Storybook을 `public/storybook`에 빌드 → 앱 빌드              |
| `pnpm e2e`                    | 프로덕션 빌드 E2E와 axe, 오프라인 E2E 포함(먼저 `build`, 포트 4391·`E2E_PORT`) |
| `pnpm size` / `pnpm lhci`     | 번들 예산(쇼핑몰 JS 367·CSS 21, 어드민 JS 210·CSS 54 kB, gzip) / Lighthouse(먼저 `build`) |

- CI(`.github/workflows/ci.yml`) 순서: install → typecheck → lint → lint:fsd → test → build → Playwright 설치 → e2e → size → lhci
- 오프라인 E2E(`e2e/offline.spec.ts`, 데스크톱·모바일)는 localhost 밖 요청을 모두 막고 `.env` 없이 빌드한 앱의 주요 화면·결제·Storybook이 뜨는지, 외부 요청 0건, axe를 봅니다. 따로 돌릴 때는 `pnpm build && pnpm exec playwright test e2e/offline.spec.ts`.
- 테스트 원칙(Testing Library): 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 역할·이름(`getByRole`)으로 찾습니다. 단위·컴포넌트는 코드 옆 `*.test.ts(x)`(Vitest + Testing Library, jsdom), 화면 흐름·잘림·넘침은 Playwright E2E, 접근성은 axe(`@axe-core/playwright`, Storybook a11y 애드온)로 검사합니다. 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.

## 5. 코드 스타일

- ESLint(`eslint-config-next` + jsx-a11y recommended 전부). Prettier 설정(`.prettierrc.json`)은 `printWidth: 100`뿐이며, 표준과 다른 점: format 스크립트·CI 서식 검사는 없습니다.
- TypeScript strict(`tsconfig.json`의 `"strict": true`, `noUncheckedIndexedAccess`)를 유지하고 `any`·`as` 단언·`@ts-ignore`를 피합니다. 외부 입력(API 요청, 추천 스트림, 브라우저 저장값)은 서버·검사 함수로 다시 확인합니다(예: 금액은 서버가 카탈로그로 다시 계산, `parseRecommendEvent`, `isSessionId`).
- 접근성 기준은 WCAG 2.2와 KWCAG 2.2이며, 자동 검사는 `eslint-plugin-jsx-a11y`와 axe(Storybook·Playwright)로 합니다. 네이티브 요소 먼저(장바구니 서랍은 `<dialog>` `showModal`), 텍스트 대비 4.5:1, 모든 기능 키보드 가능·초점 표시, 조작 크기 24px 이상(권장 44), 오류 칸에만 `aria-invalid`와 `aria-errormessage`·`aria-describedby` 연결(무엇이 잘못됐고 어떻게 고치는지), 바뀌는 안내는 `role="status"`(`<output>`에는 `aria-live`를 다시 쓰지 않음). axe를 통과해도 새 UI는 KWCAG 항목을 직접 점검합니다.
- 나라 이름은 `Intl.DisplayNames` 대신 고정 표(`entities/product/lib/country-names.ts`)에서 읽습니다(하이드레이션 불일치 방지). 사진을 바꿀 때는 이미지 캐시(31일) 때문에 파일 이름도 바꿉니다.

## 6. Git·PR

- 흐름: GitHub Flow. `main`에 직접 커밋·푸시하지 않고, 최신 `main`에서 브랜치를 만들어 PR로만 병합합니다. PR은 목적 하나로 작게 만들고 본문에 무엇·왜·검사 결과를 적습니다.
- 브랜치 이름: `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`
- 커밋 메시지: Conventional Commits `<타입>: <한국어 요약>`, 타입은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`. 버전을 올린 커밋·PR 제목은 끝에 `(x.y.z)`를 붙이고, 리뷰 반영 커밋은 `fix: 리뷰 반영 — …`로 씁니다. 호환이 깨지면 본문에 `BREAKING CHANGE:`를 적습니다.
  - 실제 예) `fix: 결제 뒤 반영은 산 수량만큼만 장바구니에서 빼기, AGENTS.md 생성 끄기 (1.0.2)`, `feat: 상품 목록 찾기·맛·성분 필터, 상품 구조화 데이터, README 화면 (1.0.0)`
  - 본문에 무엇을 왜 바꿨는지와 테스트를 적고, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙입니다.
- 기여자는 ryushin01만 남깁니다(2026-11-21 사용자 결정). 커밋 작성자는 항상 `ryushin0 <141554987+ryushin01@users.noreply.github.com>`이고, 이 저장소는 백엔드 코드가 있어 공동 작성자 줄은 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 하나만 넣습니다.
  - GitHub Actions가 커밋하는 워크플로는 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지).
  - Dependabot PR은 그대로 병합하지 않습니다. 변경 내역을 확인하고 같은 변경을 ryushin01 커밋으로 다시 만들어 병합합니다(병합 커밋 작성자가 dependabot이 되지 않게).
- 버전: Semantic Versioning(주.부.수). 기능·수정 PR은 `package.json`의 `version`과 README의 version 배지를 함께 맞춥니다. 문서만 바뀐 PR은 버전을 올리지 않습니다.
- 변경 기록: `CHANGELOG.md`(제목 "변경 기록"), 최신 버전을 위에 두고 `## x.y.z - YYYY-MM-DD` 아래 `-` 목록(기능·의존성·개발·테스트·문서)으로 적습니다. 표준(Keep a Changelog)과 다른 점: `[Unreleased]` 절과 추가·변경·수정·제거 소제목이 없습니다.
- 병합은 merge commit(`Merge pull request #N from ...`). CI가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다(이미 달린 맞는 지적은 반영).

## 7. 배포·릴리스

- Vercel 프로젝트 `dessert-land`. `main`에 병합하면 자동 배포되고, 다른 브랜치와 PR 미리보기는 끕니다(`vercel.json`의 `git.deploymentEnabled`).
- 데모: 운영 주소가 곧 데모이며(운영 환경 변수 `NEXT_PUBLIC_DEMO=1`) 쇼핑몰은 로그인이 없고, 어드민은 "관리자로 둘러보기"로 들어갑니다(고친 값은 이 브라우저에만, 자세한 구조는 `docs/development.md` "어드민"). Stripe 테스트 키가 있으면 Stripe Checkout, 없으면 내장 테스트 결제창을 씁니다. 주문은 서버에 저장하지 않고 브라우저에만 남깁니다(최근 20건).
- 릴리스: 태그·GitHub 릴리스 `vX.Y.Z`(제목도 같음), 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG의 해당 절.
- 릴리스 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`, 보관함 `DessertLand v1.0.0 고도화 계획.md`에 진행 기록, 소개가 바뀌면 프로필 `ryushin01/ryushin01` README 표 갱신.

## 8. 보안·주의사항

- 비밀값과 `.env*`의 실제 값을 커밋하지 않습니다. Stripe는 테스트 키(`sk_test_`·`rk_test_`)만 쓰고 운영 키는 `stripe.server.ts`가 거부합니다. 이 제한을 풀지 않습니다.
- Claude API는 유료이므로 공개 데모의 비용 상한(사람당 분당 8회, 인스턴스당 하루 300회)과 입력 200자 제한을 유지하고, 고객 입력은 로그에 남기지 않으며 프롬프트에서 지시가 아닌 데이터로 다룹니다.
- Stripe 샌드박스를 다른 프로젝트와 함께 쓰므로 세션 메타데이터 `app: "dessert-land"`를 유지하고, 웹훅 설정을 바꾸지 않습니다. 이름·이메일·주소는 브라우저에도 남기지 않습니다.
- 사진은 Unsplash License 무료 사진과 Wikimedia Commons 자유 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만 쓰고, 출처는 README '출처'와 `docs/credits.md`에 둡니다(`photo-credits.test.ts`가 확인). Flaticon UIcons 출처 링크는 바닥글에 둡니다.
- 지원 언어는 10개 이내로 유지합니다.
- 상태(CI·배포·릴리스·주소)는 명령 결과(`gh run`, `curl` 등)로 확인한 것만 말합니다.
- 먼저 묻기: 새 런타임 의존성 추가, 빌드·배포 설정(`next.config.ts`의 CSP 포함, `vercel.json`, 워크플로) 변경, 외부 CDN·글꼴 서버 추가.
- 절대 금지: 비밀값(Stripe·Anthropic 키)을 `NEXT_PUBLIC_*`에 넣기, `.env*` 커밋, `eslint-disable`·`--no-verify`로 검사 우회, `main`에 직접 푸시.

## 9. 공통 규칙

규칙은 3계층입니다. 1층 전역(`~/.claude/CLAUDE.md`, OpenCode는 `~/.config/opencode/AGENTS.md`로 같은 파일) → 2층 ryushin01 공통(`~/Documents/GitHub/CLAUDE.md`, Claude Code만 읽음) → 3층 이 파일. 충돌하면 이 파일이 우선합니다. 2층을 읽지 못하는 도구를 위해 핵심을 아래에 요약합니다.

- 답변·커밋·PR·문서는 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 결과를 한 번에 보고합니다. 비용·비밀값 생성·디자인 결정·되돌리기 어려운 일·다른 조직 저장소에 공개로 글 올리기는 진행 전에 보고하고 결정을 받습니다.
- 사용자의 진행 중인 작업을 보호합니다. 로컬에 커밋하지 않은 변경이나 원격에 없는 브랜치가 있으면 `git worktree add`로 따로 작업하고 끝나면 지웁니다.
- 기여자는 ryushin01만 남깁니다(커밋 작성자·`Co-Authored-By`·Actions·Dependabot 규칙은 6절).
- Vercel은 Hobby 요금제로 계정 전체 하루 100회 배포 한도가 있습니다. 배포가 많은 날은 버전 단위로 묶고, 한도에 걸리면 병합·릴리스까지만 하고 다음 날 반영합니다. 사용자가 배포일을 정하면 그 전에는 PR만 올려 둡니다.
- 공개 데모에 실제 DB 접속 정보·유료 API 키·로컬 `.env` 값을 넣지 않고, 데모 모드가 꺼지면 원래 동작이 그대로여야 합니다.
- 병합 뒤 릴리스·백업·보관함 기록·프로필 README 갱신은 7절을 따릅니다.
- 다른 세션에 보내는 공지는 ryushin01 그룹 세션에만 보냅니다.
