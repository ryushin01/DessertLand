# 개발 가이드

디저트 랜드(Dessert Land)는 전 세계 디저트가 모인 달콤한 나라를 콘셉트로, 디저트를 10개 언어로 소개하고 판매하는 쇼핑몰입니다.

## 구조 (Feature-Sliced Design)

- 계층: `_app` → `_pages` → `widgets` → `features` → `entities` → `shared`. Next의 `src/app` 라우트 파일은 `_pages`·`_app`을 다시 내보내기만 합니다.
- 슬라이스 안 코드는 세그먼트(`ui` 컴포넌트, `model` 상태·도메인 로직, `lib` 도우미, `api` 서버·요청, `config`)에 둡니다. 슬라이스는 `index.ts`(서버 전용은 `index.server.ts`)로만 가져옵니다.
- 한 곳에서만 쓰는 코드는 그 슬라이스에 둡니다. 예를 들어 홈에서만 쓰는 히어로·쇼케이스·세계 여행 같은 섹션은 `_pages/home`에, 언어·모션 전환은 `widgets/site-header`에 있습니다. 두 곳 이상에서 쓰게 되면 `features`·`widgets`로 올립니다.
- 같은 계층끼리는 가져오지 않습니다. 결제 기능 둘이 함께 쓰는 장바구니 합계(`summarizeCart`)는 `entities/cart`에 있고, 상품 가격은 `entities/product/@x/cart.ts`로 엽니다.
- GSAP은 `@/shared/lib/gsap`(독립 폴더)에서만 가져와, 움직임 상태(`@/shared/lib/motion`)를 쓰는 곳에 GSAP이 실리지 않게 합니다.
- `pnpm lint:fsd`(Steiger, CI에서도 실행)가 이 규칙을 검사합니다. `_app`·`_pages` 이름 때문에 나는 `fsd/typo-in-layer-name`만 끄고, `src/app`과 테스트·스토리는 검사에서 뺍니다. API 라우트만 쓰는 결제·추천 슬라이스는 Steiger가 참조를 세지 못해 `fsd/insignificant-slice`를 그 슬라이스에서만 끕니다.

## 언어 추가

1. `src/shared/i18n/routing.ts`의 `LOCALES`와 `LOCALE_LABELS`에 추가합니다. 지원 언어는 10개 이내로 유지합니다.
2. `src/shared/i18n/messages/ko.json`과 같은 키로 메시지 파일을 추가합니다. 타입은 `ko.json`을 기준으로 검사합니다.
3. `src/entities/product/lib/price.ts`에 통화를 연결합니다.
4. 한자나 가나, 한글처럼 라틴 글꼴에 없는 문자를 쓰면 `src/_app/layouts/LocaleLayout.tsx`의 `CJK_FONTS`와 `scripts/copy-cjk-fonts.mjs`의 `LOCALES`에 추가하고, 그 글꼴의 Fontsource 패키지를 설치합니다(외부 글꼴 서버는 쓰지 않음). `next/font`로 선언하면 모든 언어에 CSS가 붙으므로 쓰지 않습니다.

## 상품 추가

1. 사진을 `public/images/products/<slug>.webp`에 둡니다. 가로 1500px, WebP 품질 76 정도로 맞춥니다.
2. `src/entities/product/model/catalog.ts`에 상품을 추가하고, 사진 출처는 `docs/credits.md`(사진 표)에 한 줄 더합니다.
3. 모든 메시지 파일의 `products.<slug>`에 이름과 설명을 추가합니다.

## 이미지 변형

`next/image`는 너비·화질·형식마다 변형을 따로 만들고, Vercel 무료 플랜은 한 달 이미지 변환 수에 한도가 있습니다. 상품이 175종이라 기본 설정(너비 15단계 × 화질 2 × 형식 2)이면 한도를 넘을 수 있어 `next.config.ts`에서 줄였습니다.

- **너비:** `deviceSizes` 640·828·1080·1500, `imageSizes` 128·256·384. 원본이 1500px 이하라 더 큰 너비는 같은 그림을 따로 만들 뿐입니다. 단위 테스트(`image-size.test.ts`)가 모든 상품 사진이 1500px 이하인지 확인합니다.
- **형식:** AVIF 하나만 만듭니다. AVIF를 못 받는 오래된 브라우저에는 Next가 JPEG로 바꿔 보냅니다. 목록에 없는 너비(예: 1920)는 400으로 거절합니다.
- **화질:** 흐린 배경은 40, 나머지는 75입니다.
- **캐시:** 31일(`minimumCacheTTL`) 동안 다시 변환하지 않습니다. 그래서 사진을 바꿀 때는 같은 이름에 덮어쓰지 말고 파일 이름을 바꿉니다(예: `<slug>-2.webp`). 같은 이름이면 예전 사진이 최대 31일 보입니다.

## 모션 규칙

- `useMotionEnabled()`가 거짓이면 모션을 시작하지 않습니다. 시스템의 움직임 줄이기 설정과 헤더의 멈춤 버튼이 모두 반영됩니다.
- CSS의 기본값이 최종 상태입니다. GSAP은 `from`으로 시작 상태를 만들어, 모션이 꺼져도 내용이 그대로 보이게 합니다.
- 애니메이션은 `useGsap`으로 등록합니다. 언마운트와 모션 끄기에서 원래 상태로 되돌아갑니다.
- 스크롤로 가려지는 영역에 링크를 두면 초점을 받았을 때 그 장면으로 스크롤합니다. (`CategoryShowcase`, `WorldTour`)
- 깜빡임이나 번쩍임은 넣지 않습니다.

## 첫 화면 사진

`_pages/home/lib/baker-renderer.ts`가 컷아웃과 깊이 지도로 시차를 그립니다. WebGL을 쓸 수 없거나 모션이 꺼져 있으면 컷아웃 이미지를 그대로 보여 줍니다. 컷아웃은 macOS Vision의 인물 분할과 밝기 기반 알파(밀가루)를 합쳐 만들었습니다. 얼굴이 나오지 않는 사진을 써서 초상권 부담을 줄였습니다.

## AI 추천

`POST /api/recommend`가 Claude API를 스트리밍으로 호출하고, 결과를 한 줄씩 JSON으로 보냅니다.

- **키:** `ANTHROPIC_API_KEY`가 없으면 `recommendLocally`의 규칙 기반 추천을 쓰고, 화면에 "기본 추천"으로 표시합니다. API 오류, 거절, 응답 잘림, 일일 호출 상한 초과일 때도 같습니다.
- **모델:** `ANTHROPIC_MODEL`로 바꿀 수 있습니다. 기본값은 `claude-opus-5-5`이고, 짧은 응답이라 effort는 `low`, `max_tokens`는 2000입니다. 상품 목록이 든 시스템 프롬프트는 프롬프트 캐시를 씁니다.
- **응답 검증:** 구조화 출력으로 상품을 카탈로그 안에서만 고르게 하고, 서버에서 다시 검사합니다. 없는 상품, 중복, 제외 요청한 알레르기 성분이 든 상품은 지우고 3개까지만 보냅니다.
- **입력:** 200자로 제한하고, 프롬프트에서 고객 입력을 지시가 아닌 데이터로 다룹니다. 입력 내용은 로그에 남기지 않습니다.
- **비용 제한:** 사람당 분당 8회, 서버 인스턴스당 하루 300회입니다. 메모리 기반이라 정확한 상한은 아닙니다. 실제 비용 상한은 Claude Console의 사용 한도로 정합니다.

상품별 맛은 `entities/product/model/tastes.ts`에 있습니다(규칙 기반 추천과 상품 목록이 함께 씀). 상품을 추가하면 그 상품의 맛도 더합니다(단위 테스트가 모든 상품을 확인). 새 맛을 추가할 때는 `TASTES`(같은 파일), 추천의 `CHIP_MEANINGS`(`api/prompt.ts`), 메시지 파일의 `advisor.chips`를 함께 고칩니다.

추천 스트림의 이벤트는 `features/recommend-dessert/model/parse-event.ts`의 `parseRecommendEvent`로 확인하고 추천은 3개까지만 받습니다. 오류나 형식 오류로 중간에 끝나도 `finally`에서 reader를 닫습니다. 결제 창은 https 주소일 때만 엽니다.

## 검색 엔진

- 언어별 대표 주소와 `hreflang`(`localeAlternates`), 사이트맵(홈·목록·분류별 목록·상품, 10개 언어)을 둡니다.
- 상품 상세는 schema.org `Product`·`Offer` 구조화 데이터(JSON-LD)로 이름·설명·사진·가격(그 언어의 통화)을 알립니다(`_pages/product/lib/json-ld.ts`). `<`를 이스케이프해 script 태그가 닫히지 않게 합니다.
- 주문·주문 완료·주문 내역은 검색에서 뺍니다(`robots: { index: false }`).

## 성능 측정

- **Web Vitals:** `<SpeedInsights />`가 프로덕션의 실사용 수치를 Vercel로 보냅니다. Vercel 프로젝트의 Speed Insights에서 봅니다. 무료 범위는 팀 전체 30일 10,000건이고, 넘으면 수집이 일시 중지됩니다.
- **번들 분석:** `pnpm analyze`로 어떤 모듈이 어느 경로에 실리는지 봅니다.
- **전송량 예산:** `e2e/performance-budget.spec.ts`가 첫 화면 HTML이 요구하는 JS의 압축 크기를 검사합니다. 프리페치로 나중에 받는 코드는 세지 않습니다.

| 경로 | 측정값(JS, 1.0.0) | 예산 |
|---|---|---|
| `/ko` | 241KB | 250KB |
| `/ko/shop` | 234KB | 245KB |
| `/ko/shop/baklava` | 233KB | 245KB |
| `/ko/checkout` | 192KB | 200KB |

0.8.0에서 예산을 10KB씩 올렸습니다. 모든 화면에 실리는 코드가 늘었기 때문입니다. 하이드레이션이 깨지지 않도록 나라 이름을 고정 표로 그리게 했고(0.6.1, 약 2.6KB), 주문 내역·결제 뒤 반영 코드가 들어갔습니다(0.8.0). 결제 뒤 반영 코드는 반영할 주문이 있을 때만 받습니다(`_app/state/OrderSync`). 상품별 맛 표는 커서 서버 공개 API(`entities/product/index.server.ts`)로만 내보내고, 상품 목록이 그 목록의 맛만 속성으로 받습니다.

GSAP은 `@/shared/lib/gsap`에서만 가져옵니다. `@/shared/lib/motion`이나 `@/shared/ui`로 다시 내보내면 모든 페이지에 실립니다. `RevealText`도 같은 이유로 `@/shared/ui/reveal-text`에서 가져옵니다.

- **클라이언트 메시지:** 레이아웃의 `NextIntlClientProvider`에는 `pickClientMessages`(`shared/i18n/client-messages.ts`)로 고른 메시지만 넘깁니다. 지정하지 않으면 next-intl이 메시지 전체를 모든 화면에 싣습니다. 상품은 이름만 넘기고, 설명은 상품 상세가 서버에서 번역해 `ProductDetail`의 `description` 속성으로 넘깁니다. 서버에서만 쓰는 `meta`·`footer`·`notFound`는 넘기지 않습니다. 클라이언트 컴포넌트에서 이 묶음을 새로 쓰게 되면 함께 고칩니다. E2E가 주문·목록 화면에 상품 설명이 없는지 확인합니다.
- **찾기·필터:** 상품 목록의 이름·나라 찾기, 맛 고르기, 빼고 싶은 성분은 브라우저에서만 거릅니다(`_pages/shop/model/filter-products.ts`). 주소를 바꾸지 않아 목록 페이지는 정적으로 남습니다. 맛은 고른 것 중 하나라도 있으면, 성분은 하나라도 들어 있으면 뺍니다. 대소문자와 라틴 문자 악센트는 무시하고, 영문 slug로도 찾습니다.
- **정적 상품 목록:** 상품 목록은 주소의 검색 매개변수를 읽지 않고 정적으로 만듭니다. 분류별 목록도 미리 만든 페이지 `/[locale]/shop/category/[category]`입니다. 0.6.x까지의 `/[locale]/shop?category=<분류>`와 0.5.0 이전 분류 주소는 `src/proxy.ts`가 그 페이지로 영구 이동(308)합니다(`_app/routing/shop-category.ts`). 정적 페이지는 클라이언트 탐색에서 검색 매개변수를 캐시 키로 쓰지 않으므로, 분류를 `?category=`로 두고 내부 재작성하면 필터를 눌러도 목록이 바뀌지 않습니다. E2E가 목록 응답이 `no-store`가 아닌지 확인합니다.

## 배포

`main`에 머지하면 Vercel이 프로덕션에 자동 배포합니다. 도메인을 연결하면 `NEXT_PUBLIC_SITE_URL`을 설정합니다. 사이트맵, 대표 주소, 공유 이미지가 이 값을 씁니다.

## 로고

소프트아이스크림 아이콘(Google Noto Emoji, Apache 2.0)입니다. 머리글 로고(`src/shared/ui/logo/Logo.tsx`)와 README 제목은 같은 파일 `public/brand/logo.png`(128px, 바탕 없음)를 씁니다. 바꾸면 같은 그림으로 아래를 모두 맞추고, 머리글이 찍힌 README 화면(`pnpm screenshots`)을 다시 찍고 README 출처 표를 고칩니다.

| 파일 | 쓰임 |
|---|---|
| `public/brand/logo.png` | 머리글 로고, README 제목 (128px, 바탕 없음) |
| `public/favicon.ico` | 파비콘 (16·32·48px) |
| `public/icon-192.png` | 큰 파비콘 (192px, 바탕 없음) |
| `public/apple-touch-icon.png` | iPhone 홈 화면 아이콘 (180px, 코코아 바탕) |

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

한 주문은 99종까지입니다(`MAX_ORDER_LINES`). Stripe Checkout이 결제 항목을 100줄까지 받고 그중 한 줄이 배송비이기 때문입니다. 넘으면 주문 화면이 결제 버튼 대신 장바구니에서 고르라고 안내하고, 서버 검증(`isValidOrderLines`, 두 결제 경로가 함께 씀)도 거절합니다. 결제 뒤 장바구니에서 뺄 상품의 slug는 메타데이터 `items`에 쉼표로 이어 담고, 값 하나의 상한(500자)을 넘을 때만 `items_1`, `items_2`…로 나눕니다. 500자 안이면 예전과 같은 모양이라 이전 버전으로 되돌려도 읽힙니다.

키가 없으면 내장 테스트 결제창과 `POST /api/payments`를 씁니다. CI와 E2E는 이 경로로 동작합니다.

### 주문 내역과 결제 뒤 반영

주문은 서버에 저장하지 않고, 이 브라우저에만 남깁니다(`entities/order`, 최근 20건). 이름·이메일·주소는 남기지 않습니다.

- **Stripe 주문:** 결제 화면으로 가기 전에 세션 ID와 결제할 상품 줄(상품과 수량)만 저장합니다. `/[locale]/orders`(주문 내역)는 `POST /api/orders`로 그 세션들의 주문 번호·금액·상태를 Stripe에서 조회해 보여 줍니다. 세션 ID는 추측할 수 없는 값이라 그 값을 가진 브라우저만 조회할 수 있습니다.
- **결제 뒤 반영:** 결제를 마치고 완료 화면으로 돌아오지 못하면(창을 닫음 등) 장바구니가 그대로 남습니다. `_app/state/OrderSync`(`useSettleStripeOrders`)가 다음 방문 때 48시간 안의 반영 전 주문을 조회해, 결제된 장바구니 주문은 결제 전에 저장한 수량만큼 장바구니에서 빼고 반영됨으로 표시합니다. 반영이 늦어지는 사이 같은 상품을 다시 담았다면 그만큼은 남습니다. 결제 중(`open`)이거나 잠시 조회하지 못한(`unavailable`, 네트워크·요청 제한·서버 오류) 주문은 반영하지 않고 10분 뒤 다시 묻습니다(같은 탭에서는 10분에 한 번). 없는 세션·다른 프로젝트 세션(`unknown`)과 만료(`expired`)는 끝난 결과로 봅니다. 완료 화면에서 반영한 주문도 반영됨으로 표시해 두 번 빼지 않습니다.
- **주문 목록 바꾸기:** 주문 목록 atom은 구독하는 컴포넌트가 마운트될 때 저장값을 읽습니다. 구독하지 않는 화면(주문·완료 화면, Stripe 버튼)이 그대로 바꾸면 빈 목록 위에 써서 예전 주문을 덮어쓰므로, 바꿀 때는 저장소의 최신 값을 읽어 그 위에 적용하는 `updateSavedOrdersAtom`을 씁니다. 저장값은 읽을 때와 다른 탭의 변경을 받을 때 모두 모양을 확인하고(세션 ID는 조회 API와 같은 규칙 `isSessionId`), 쓰기는 실패해도 예외를 던지지 않아(저장 공간 부족 등) 결제·장바구니 흐름을 막지 않습니다.
- **세션 구분:** Stripe 샌드박스를 다른 프로젝트와 함께 쓰므로, 세션 메타데이터에 `app: "dessert-land"`를 남기고 결제 확인과 주문 조회는 이 표시가 있는 세션만 받습니다. 0.7.x까지의 세션은 `source`(cart·buy)로 알아봅니다.
- **내장 테스트 결제:** 서버에 남지 않으므로 주문 번호·금액·상품을 브라우저에 남겨 주문 내역에 보여 줍니다.
- 웹훅과 주문 DB는 배송 정보 같은 개인정보를 이 사이트가 저장하게 되고, 함께 쓰는 샌드박스의 웹훅 설정도 바꿔야 해서 쓰지 않습니다.
- **한 번만 반영:** 완료 화면과 다음 방문은 같은 `settleStripeOrdersAtom`(`entities/order`)으로 반영합니다. 저장소의 최신 주문 목록에서 아직 반영하지 않은 주문만 골라 반영됨으로 바꾸고 그 수량을 빼므로, 완료 화면과 다음 방문, 두 탭이 같은 주문을 반영해도 한 번만 빠집니다. 반영됨 표시가 저장소에 남은 주문만 빼므로, 표시를 저장하지 못하면(저장소 오류) 그 주문은 이번에 빼지 않고 다음 반영 때 뺍니다. 수량을 저장하지 않은 1.0.1까지의 주문과 이 브라우저에 기록이 없는 주문은 Stripe 메타데이터의 상품 slug로 장바구니 줄을 통째로 뺍니다.
- **알려진 한계:** 주문 내역 저장은 실패해도 결제를 막지 않으므로(저장 공간 부족 등), 그때 한 Stripe 주문은 주문 내역과 다음 방문 때의 반영에서 빠집니다. 완료 화면으로 돌아오면 그 주문의 상품 줄은 장바구니에서 뺍니다.

### 실제 판매로 전환할 때

주문은 브라우저에만 남고 웹훅이 없으며, 요청 제한은 서버 인스턴스마다 따로 셉니다. 실제 판매 전에 다음이 필요합니다.

1. `stripe.server.ts`의 테스트 키 제한을 해제하고 운영 키를 서버 환경 변수에 둡니다.
2. 주문 저장소를 추가하고, 웹훅으로 결제 상태를 맞추며, 멱등 키로 중복 생성을 막습니다.
3. 고정 환율을 실제 판매 가격으로 바꾸고, 국가별 세금과 배송비를 반영합니다.

## 라이선스

- **사진:** [Unsplash License](https://unsplash.com/license)의 무료 사진(Unsplash+ 제외)과 [Wikimedia Commons](https://commons.wikimedia.org)의 자유 라이선스 사진(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만 씁니다. 출처는 화면이 아니라 README의 '출처'와 `docs/credits.md`에 둡니다. Commons 사진은 저작자·라이선스(링크)·원본 파일 주소를 적고, 크기와 형식(WebP, 1400px 이하) 말고는 고치지 않습니다. 단위 테스트(`photo-credits.test.ts`)가 모든 상품의 사진 파일과 `docs/credits.md`의 출처 줄, Commons 사진의 라이선스를 확인합니다.
- **나라:** 기원이 여러 나라에 걸치거나 다툼이 있는 디저트는 나라 코드 `XX`로 두고 "기타"로 표시합니다. 세계 여행 구간에는 넣지 않습니다. 나라 이름은 런타임 `Intl.DisplayNames` 대신 고정 표(`entities/product/lib/country-names.ts`)에서 읽습니다. ICU 데이터가 실행 환경마다 달라(홍콩: Node "Hong Kong SAR China", Chrome "Hong Kong") 서버와 브라우저가 다른 글자를 그리면 하이드레이션이 깨지기 때문입니다. 새 나라는 Node의 `Intl.DisplayNames`로 10개 언어 이름을 만들어 더하고, 긴 이름이 환경마다 다르면 짧은 이름(`style: "short"`)을 씁니다. 단위 테스트가 모든 상품의 나라가 표에 있는지 확인합니다.
- **아이콘:** Flaticon UIcons 무료 라이선스는 사이트 바닥글에 출처 줄을 두도록 정해 푸터에 'Uicons by Flaticon' 링크를 두고, README의 '출처'에도 적습니다. 쓰는 아이콘만 `scripts/build-icons.py`로 추려 냅니다.

## 테스트

- 단위 테스트는 코드 옆의 `*.test.ts(x)`에 둡니다.
- 잘림, 넘침, 접근성은 `pnpm build` 후 `pnpm e2e`로 확인합니다. axe를 통과해도 KWCAG 준수는 아니므로 새 UI는 항목을 직접 점검합니다.
- E2E 서버는 4391 포트를 씁니다. 다른 작업이 그 포트를 쓰고 있으면 `E2E_PORT=4492 pnpm e2e`처럼 바꿉니다.
- **오프라인 검증:** `e2e/offline.spec.ts`는 localhost 밖으로 나가는 요청을 모두 막고(`route.abort`) `.env` 없이 빌드한 앱에서 홈·상품 목록·상세·추천·결제(내장 테스트 결제)·주문 내역·일본어·중국어·튀르키예어 화면·Storybook이 내용과 함께 뜨는지, 외부로 나가려 한 요청이 하나도 없는지 보고 axe를 돌립니다. `pnpm e2e`(CI 포함)에 들어 있고, 따로 돌릴 때는 `pnpm build && pnpm exec playwright test e2e/offline.spec.ts`입니다.

## 오프라인·외부 서비스 대체

포트폴리오 데모라 외부 서비스가 끊겨도 화면이 비면 안 됩니다.

| 외부 의존 | 끊겼을 때 |
| --- | --- |
| Stripe Checkout(`STRIPE_SECRET_KEY`) | 키가 없으면 처음부터, 세션 만들기가 실패(서버 502·네트워크 오류)하면 그 자리에서 내장 테스트 결제창으로 바꾸고 `role="status"`로 알림 |
| Claude API(`ANTHROPIC_API_KEY`) | 키가 없거나 호출이 실패·시간 초과(30초)면 규칙 기반 기본 추천("기본 추천 (AI 미사용)") |
| 글꼴 | Exo 2(영문·숫자)는 `next/font/local`, 한중일 글꼴은 Fontsource 파일을 설치 때 `public/fonts/cjk/`로 복사, 하다 바탕은 저장소 파일 |
| 사진·아이콘 | 모두 `public/`의 파일 |
| Sentry·Speed Insights | DSN이 없으면 Sentry를 싣지 않고, 전송 실패는 조용히 넘어감 |

## 접근성 메모

- **모달과 알림:** `showModal()`로 연 대화상자 밖은 비활성(inert)이 되어 접근성 트리에서 빠집니다. 모달을 열면서 바깥 알림 영역(`role="status"`)의 문구를 바꾸면 읽히지 않으므로, 장바구니 서랍은 방금 담은 상품을 서랍의 설명(`aria-describedby`)으로 연결하고 닫을 때 비웁니다.
- **입력 오류:** 오류가 난 칸에만 `aria-invalid="true"`를 붙이고, 오류 문구를 `aria-errormessage`와 `aria-describedby`로 함께 연결합니다. 문구에는 무엇이 잘못됐는지와 고치는 방법을 적습니다(예: "받는 분 이름이 비어 있습니다. 받는 분의 이름을 입력해 주세요.").
- **상태 표시:** `<output>`은 암시적으로 `role="status"`이므로 `aria-live`를 다시 쓰지 않습니다.
- **쌓임 순서:** 연출 요소가 쌓임 순서(`z-index`)를 계속 올린다면 `isolation: isolate`한 층 안에 두어 안쪽 순서가 바깥으로 새지 않게 합니다. `isolation`은 층의 위치를 정하지 않으므로, 층 자체의 `z-index`를 글자와 버튼보다 낮게 둡니다(스윗 트레일: 사진 층 1, 제목 2, 버튼 3).

## 디자인 시스템(Storybook) 배포

`pnpm build`는 Storybook을 먼저 `public/storybook`에 빌드한 뒤 앱을 빌드합니다. 그래서 앱과 같은 주소의 `/storybook`에 함께 배포되고, 바닥글의 **Design system (Storybook)** 링크로 들어갑니다.

- `/storybook`은 정적 파일 폴더라 `/storybook/index.html`로 보냅니다(`next.config.ts`의 `redirects`). 언어 미들웨어(`src/proxy.ts`)는 이 경로를 건너뜁니다.
- `/storybook/` 아래만 미리보기 iframe을 위해 `X-Frame-Options: SAMEORIGIN`을 쓰고, 나머지는 `DENY`를 유지합니다.
- `pnpm build-storybook`(앱 빌드가 먼저 부르는 스크립트)으로 빌드할 때는 `public`을 복사하지 않습니다. 같은 주소에서 열리므로 이미지는 앱의 것을 씁니다.

## 품질 예산

- **번들 크기:** `pnpm size`가 전체 JS 367 kB, CSS 21 kB(gzip)를 넘으면 실패합니다. 기준은 `.size-limit.json`에 있습니다.
- **Lighthouse:** `pnpm lhci`가 한국어·영어 첫 화면, 상점, 바클라바 상세가 데스크톱 기준 성능 90·접근성 100·권장 사항 95·SEO 90점, LCP 2.5초·TBT 200ms·CLS 0.1 이하인지 3번씩 재서 확인합니다. 기준은 `lighthouserc.json`에 있습니다.
- **접근성 린트:** `eslint-config-next`는 jsx-a11y 규칙을 몇 개만 켭니다. 플러그인은 이미 등록되어 있어 `eslint.config`에서 recommended 규칙만 더해 모두 켭니다. 장바구니 서랍(`<dialog>`)의 배경 클릭 닫기는 Esc·닫기 버튼이 키보드 대안이라 그 줄만 예외로 둡니다.

두 검사 모두 프로덕션 빌드가 먼저 있어야 하며, CI는 빌드 뒤에 돌립니다.

## 모니터링

브라우저에서 화면을 그리기 전에 모니터링을 켜고, Sentry와 web-vitals는 나중에 따로 받습니다. Sentry는 페이지를 다 받은 뒤(load) 브라우저가 한가할 때 받고, load가 10초 안에 오지 않으면 그때 바로 받습니다.

| 환경 변수 | 내용 |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | 있으면 브라우저와 서버에서 처리하지 못한 오류, 나쁜(poor) Web Vitals를 Sentry로 보냅니다. 없으면 Sentry를 번들에 넣지 않고, 개발 모드에서 Web Vitals를 콘솔에만 찍습니다 |

- Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·헤더·쿼리 문자열, 방문 기록(세션), 이동·클릭 기록(브레드크럼), 콘솔 기록은 모으지 않습니다. 오류에 붙는 콜백 인수, Error가 아닌 일반 객체로 거부된 Promise의 필드 값(`extra.__serialized__`), 주소의 `#` 뒤도 보내기 전에 지웁니다. Sentry를 받기 전에 난 오류는 모아 두었다가 처리되지 않은 오류로 보냅니다.
- 쓰는 함수만 `sentry.ts`에서 다시 내보내 약 31 kB(gzip)로 받습니다. 모듈 전체를 불러오면 리플레이·피드백까지 들어가 140 kB가 됩니다.
- 실제 방문자의 속도는 Vercel Speed Insights로도 봅니다. 로컬 Lighthouse에서는 이 스크립트가 404라 권장 사항이 96점으로 나옵니다.
- **중계 경로:** 브라우저는 Sentry로 직접 보내지 않고 같은 사이트의 `POST /api/monitoring`으로 보냅니다(`tunnel`). CSP의 `connect-src 'self'`를 넓히지 않아도 되고 광고 차단기에도 덜 막힙니다. 중계는 묶음 머리글의 DSN이 이 사이트의 DSN과 같을 때만 넘기고, 256KB를 넘는 묶음은 거절하며(Content-Length가 없어도 바이트 수를 세며 읽다가 넘으면 멈춤), 접속자마다 1분에 60번까지 받습니다. DSN이 없으면 404로 답합니다.
- **서버 오류:** `src/instrumentation.ts`의 `onRequestError`가 화면 렌더링·API 라우트에서 처리하지 못한 오류를 Sentry로 보냅니다(`_app/monitoring/server.ts`). SDK 없이 envelope를 직접 만들고, 경로는 쿼리 없이 보내며 헤더·쿠키는 넣지 않습니다. 보내기는 2초까지만 기다립니다.
- **오류 화면:** 화면을 그리다 오류가 나면 `app/[locale]/error.tsx`(`_app/layouts/RouteError.tsx`)가 404 화면과 같은 배치로 다시 시도·홈으로 버튼을 보여 주고, 오류를 Sentry로 보냅니다.

## 의존성 갱신 (Dependabot)

`.github/dependabot.yml`이 npm 패키지는 매주 부 버전·패치를 한 PR로 묶어 올리고, GitHub Actions는 매달 올립니다. 주 버전은 따로 PR이 열리므로 변경 내역을 확인하고 CI가 통과할 때만 병합합니다.

## PR 미리보기 배포

Vercel의 하루 배포 한도를 아끼려고 PR 미리보기 배포를 껐습니다(`vercel.json`의 `git.deploymentEnabled`). `main`에 머지할 때만 운영으로 배포하고, PR에서는 CI 검사만 돕니다. 미리보기가 꼭 필요하면 그 브랜치를 `deploymentEnabled`에 잠시 넣습니다.
