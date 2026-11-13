# 개발 가이드

디저트 랜드(Dessert Land)는 전 세계 디저트가 모인 달콤한 나라를 콘셉트로, 디저트를 10개 언어로 소개하고 판매하는 쇼핑몰입니다.

## 언어 추가

1. `src/shared/i18n/routing.ts`의 `LOCALES`와 `LOCALE_LABELS`에 추가합니다. 지원 언어는 10개 이내로 유지합니다.
2. `src/shared/i18n/messages/ko.json`과 같은 키로 메시지 파일을 추가합니다. 타입은 `ko.json`을 기준으로 검사합니다.
3. `src/entities/product/lib/price.ts`에 통화를 연결합니다.
4. 한자나 가나, 한글처럼 라틴 글꼴에 없는 문자를 쓰면 `src/_app/layouts/LocaleLayout.tsx`의 `CJK_FONTS`에 추가합니다. `next/font`로 선언하면 모든 언어에 CSS가 붙으므로 쓰지 않습니다.

## 상품 추가

1. 사진을 `public/images/products/<slug>.webp`에 둡니다. 가로 1500px, WebP 품질 76 정도로 맞춥니다.
2. `src/entities/product/model/catalog.ts`에 상품과 사진 출처를 추가합니다.
3. 모든 메시지 파일의 `products.<slug>`에 이름과 설명을 추가합니다.

## 모션 규칙

- `useMotionEnabled()`가 거짓이면 모션을 시작하지 않습니다. 시스템의 움직임 줄이기 설정과 헤더의 멈춤 버튼이 모두 반영됩니다.
- CSS의 기본값이 최종 상태입니다. GSAP은 `from`으로 시작 상태를 만들어, 모션이 꺼져도 내용이 그대로 보이게 합니다.
- 애니메이션은 `useGsap`으로 등록합니다. 언마운트와 모션 끄기에서 원래 상태로 되돌아갑니다.
- 스크롤로 가려지는 영역에 링크를 두면 초점을 받았을 때 그 장면으로 스크롤합니다. (`CategoryShowcase`, `WorldTour`)
- 깜빡임이나 번쩍임은 넣지 않습니다.

## 첫 화면 사진

`widgets/hero/baker-renderer.ts`가 컷아웃과 깊이 지도로 시차를 그립니다. WebGL을 쓸 수 없거나 모션이 꺼져 있으면 컷아웃 이미지를 그대로 보여 줍니다. 컷아웃은 macOS Vision의 인물 분할과 밝기 기반 알파(밀가루)를 합쳐 만들었습니다. 얼굴이 나오지 않는 사진을 써서 초상권 부담을 줄였습니다.

## AI 추천

`POST /api/recommend`가 Claude API를 스트리밍으로 호출하고, 결과를 한 줄씩 JSON으로 보냅니다.

- **키:** `ANTHROPIC_API_KEY`가 없으면 `recommendLocally`의 규칙 기반 추천을 쓰고, 화면에 "기본 추천"으로 표시합니다. API 오류, 거절, 응답 잘림, 일일 호출 상한 초과일 때도 같습니다.
- **모델:** `ANTHROPIC_MODEL`로 바꿀 수 있습니다. 기본값은 `claude-opus-5-5`이고, 짧은 응답이라 effort는 `low`, `max_tokens`는 2000입니다. 상품 목록이 든 시스템 프롬프트는 프롬프트 캐시를 씁니다.
- **응답 검증:** 구조화 출력으로 상품을 카탈로그 안에서만 고르게 하고, 서버에서 다시 검사합니다. 없는 상품, 중복, 제외 요청한 알레르기 성분이 든 상품은 지우고 3개까지만 보냅니다.
- **입력:** 200자로 제한하고, 프롬프트에서 고객 입력을 지시가 아닌 데이터로 다룹니다. 입력 내용은 로그에 남기지 않습니다.
- **비용 제한:** 사람당 분당 8회, 서버 인스턴스당 하루 300회입니다. 메모리 기반이라 정확한 상한은 아닙니다. 실제 비용 상한은 Claude Console의 사용 한도로 정합니다.

새 맛을 추가할 때는 `TASTE_CHIPS`, `TASTES`, `CHIP_MEANINGS`, 메시지 파일의 `advisor.chips`를 함께 고칩니다.

추천 스트림의 이벤트는 `features/recommend-dessert/model/parse-event.ts`의 `parseRecommendEvent`로 확인하고 추천은 3개까지만 받습니다. 오류나 형식 오류로 중간에 끝나도 `finally`에서 reader를 닫습니다. 결제 창은 https 주소일 때만 엽니다.

## 성능 측정

- **Web Vitals:** `<SpeedInsights />`가 프로덕션의 실사용 수치를 Vercel로 보냅니다. Vercel 프로젝트의 Speed Insights에서 봅니다. 무료 범위는 팀 전체 30일 10,000건이고, 넘으면 수집이 일시 중지됩니다.
- **번들 분석:** `pnpm analyze`로 어떤 모듈이 어느 경로에 실리는지 봅니다.
- **전송량 예산:** `e2e/performance-budget.spec.ts`가 첫 화면 HTML이 요구하는 JS의 압축 크기를 검사합니다. 프리페치로 나중에 받는 코드는 세지 않습니다.

| 경로 | 측정값(JS) | 예산 |
|---|---|---|
| `/ko` | 226KB | 240KB |
| `/ko/shop` | 221KB | 235KB |
| `/ko/shop/baklava` | 221KB | 235KB |
| `/ko/checkout` | 179KB | 190KB |
| `/ko/credits` | 175KB | 185KB |

GSAP은 `@/shared/lib/motion/gsap`에서만 가져옵니다. `@/shared/lib/motion`이나 `@/shared/ui`로 다시 내보내면 모든 페이지에 실립니다. `RevealText`도 같은 이유로 `@/shared/ui/reveal-text`에서 가져옵니다.

## 배포

`main`에 머지하면 Vercel이 프로덕션에 자동 배포합니다. 도메인을 연결하면 `NEXT_PUBLIC_SITE_URL`을 설정합니다. 사이트맵, 대표 주소, 공유 이미지가 이 값을 씁니다.

## 로고

케이크 언덕 꼭대기에 깃발을 꽂은 모양으로, "랜드"를 표현합니다. 원본은 `src/shared/ui/logo/Logo.tsx`이고, 바꾸면 `public/favicon.svg`, `public/apple-touch-icon.png`, `docs/images/logo.svg`도 함께 맞춥니다.

## 구매와 결제

- **장바구니 구매:** 장바구니의 모든 상품을 주문하고, 결제가 승인되면 장바구니를 비웁니다.
- **바로 구매:** `/checkout?buy=<slug>&qty=<수량>`으로 이동해 그 상품만 주문합니다. 장바구니는 그대로 둡니다.
- **금액 검증:** 서버가 카탈로그로 금액을 다시 계산해, 예상 금액과 다르면 결제를 시작하지 않습니다.

### Stripe 테스트 모드

`STRIPE_SECRET_KEY`에 테스트 키(`sk_test_` 또는 `rk_test_`)를 넣으면 Stripe Checkout을 씁니다. 운영 키는 `stripe.server.ts`에서 거부하므로 실제 청구가 일어나지 않습니다.

```bash
cp .env.example .env.local                                 # 로컬
pnpm dlx vercel env add STRIPE_SECRET_KEY production       # Vercel
```

테스트 카드는 `4242 4242 4242 4242`, 미래의 만료일, 아무 CVC입니다. 결제 수단은 카드로 제한하고 자동 환율(Adaptive Pricing)은 꺼서, 사이트에 표시한 통화와 금액을 그대로 청구합니다. 결제 화면의 이름은 샌드박스 계정 이름 대신 세션의 `branding_settings.display_name`으로 지정합니다. 흐름은 다음과 같습니다.

1. `POST /api/checkout-session`이 서버 가격으로 Stripe 세션을 만듭니다.
2. 사용자는 Stripe 화면에서 카드와 배송 정보를 입력합니다.
3. 완료 페이지가 주소의 세션 ID를 Stripe에 직접 조회해 결제 여부를 확인합니다. 장바구니 주문이면 이때 장바구니를 비웁니다.

키가 없으면 내장 테스트 결제창과 `POST /api/payments`를 씁니다. CI와 E2E는 이 경로로 동작합니다.

### 실제 판매로 전환할 때

주문을 저장하지 않으며, 요청 제한과 웹훅도 없습니다. 실제 판매 전에 다음이 필요합니다.

1. `stripe.server.ts`의 테스트 키 제한을 해제하고 운영 키를 서버 환경 변수에 둡니다.
2. 주문 저장소를 추가하고, 웹훅으로 결제 상태를 맞추며, 멱등 키로 중복 생성을 막습니다.
3. 고정 환율을 실제 판매 가격으로 바꾸고, 국가별 세금과 배송비를 반영합니다.

## 라이선스

- **사진:** [Unsplash License](https://unsplash.com/license)의 무료 사진만 씁니다. Unsplash+ 사진은 쓰지 않습니다. 출처는 `catalog.ts`와 `/credits` 페이지에 있습니다.
- **아이콘:** Flaticon UIcons 무료 라이선스는 출처 표기가 필요해 푸터와 `/credits`에 표기합니다. 쓰는 아이콘만 `scripts/build-icons.py`로 추려 냅니다.

## 테스트

- 단위 테스트는 코드 옆의 `*.test.ts(x)`에 둡니다.
- 잘림, 넘침, 접근성은 `pnpm build` 후 `pnpm e2e`로 확인합니다. axe를 통과해도 KWCAG 준수는 아니므로 새 UI는 항목을 직접 점검합니다.

## 디자인 시스템(Storybook) 배포

`pnpm build`는 Storybook을 먼저 `public/storybook`에 빌드한 뒤 앱을 빌드합니다. 그래서 앱과 같은 주소의 `/storybook`에 함께 배포되고, 바닥글의 **Design system (Storybook)** 링크로 들어갑니다.

- `/storybook`은 정적 파일 폴더라 `/storybook/index.html`로 보냅니다(`next.config.ts`의 `redirects`). 언어 미들웨어(`src/proxy.ts`)는 이 경로를 건너뜁니다.
- `/storybook/` 아래만 미리보기 iframe을 위해 `X-Frame-Options: SAMEORIGIN`을 쓰고, 나머지는 `DENY`를 유지합니다.
- `pnpm build-storybook`(앱 빌드가 먼저 부르는 스크립트)으로 빌드할 때는 `public`을 복사하지 않습니다. 같은 주소에서 열리므로 이미지는 앱의 것을 씁니다.

## 품질 예산

- **번들 크기:** `pnpm size`가 전체 JS 365 kB, CSS 19 kB(gzip)를 넘으면 실패합니다. 기준은 `.size-limit.json`에 있습니다.
- **Lighthouse:** `pnpm lhci`가 한국어·영어 첫 화면, 상점, 바클라바 상세가 데스크톱 기준 성능 90·접근성 100·권장 사항 95·SEO 90점, LCP 2.5초·TBT 200ms·CLS 0.1 이하인지 3번씩 재서 확인합니다. 기준은 `lighthouserc.json`에 있습니다.
- **접근성 린트:** `eslint-config-next`는 jsx-a11y 규칙을 몇 개만 켭니다. 플러그인은 이미 등록되어 있어 `eslint.config`에서 recommended 규칙만 더해 모두 켭니다. 장바구니 서랍(`<dialog>`)의 배경 클릭 닫기는 Esc·닫기 버튼이 키보드 대안이라 그 줄만 예외로 둡니다.

두 검사 모두 프로덕션 빌드가 먼저 있어야 하며, CI는 빌드 뒤에 돌립니다.

## 모니터링

브라우저에서 화면을 그리기 전에 모니터링을 켜고, Sentry와 web-vitals는 나중에 따로 받습니다. Sentry는 페이지를 다 받은 뒤(load) 브라우저가 한가할 때 받고, load가 10초 안에 오지 않으면 그때 바로 받습니다.

| 환경 변수 | 내용 |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | 있으면 처리하지 못한 오류와 나쁜(poor) Web Vitals를 Sentry로 보냅니다. 없으면 Sentry를 번들에 넣지 않고, 개발 모드에서 Web Vitals를 콘솔에만 찍습니다 |

- Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·헤더·쿼리 문자열, 방문 기록(세션), 이동·클릭 기록(브레드크럼), 콘솔 기록은 모으지 않습니다. 오류에 붙는 콜백 인수, Error가 아닌 일반 객체로 거부된 Promise의 필드 값(`extra.__serialized__`), 주소의 `#` 뒤도 보내기 전에 지웁니다. Sentry를 받기 전에 난 오류는 모아 두었다가 처리되지 않은 오류로 보냅니다.
- 쓰는 함수만 `sentry.ts`에서 다시 내보내 약 31 kB(gzip)로 받습니다. 모듈 전체를 불러오면 리플레이·피드백까지 들어가 140 kB가 됩니다.
- 실제 방문자의 속도는 Vercel Speed Insights로도 봅니다. 로컬 Lighthouse에서는 이 스크립트가 404라 권장 사항이 96점으로 나옵니다.
- 브라우저 오류만 모읍니다. 서버에서 난 오류는 호스팅(Vercel 등)의 로그로 확인합니다.

## 의존성 갱신 (Dependabot)

`.github/dependabot.yml`이 npm 패키지는 매주 부 버전·패치를 한 PR로 묶어 올리고, GitHub Actions는 매달 올립니다. 주 버전은 따로 PR이 열리므로 변경 내역을 확인하고 CI가 통과할 때만 병합합니다.
