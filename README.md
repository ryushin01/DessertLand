# 🍰 디저트 랜드 (Dessert Land)

[![CI](https://github.com/ryushin01/DessertLand/actions/workflows/ci.yml/badge.svg)](https://github.com/ryushin01/DessertLand/actions/workflows/ci.yml)
![version](https://img.shields.io/badge/version-0.1.2-ff6484)
![languages](https://img.shields.io/badge/languages-10-f2b267)

**전 세계의 디저트**를 소개하고 판매하는 글로벌 쇼핑몰입니다. 한국어를 기본으로 **영어, 일본어, 중국어, 프랑스어, 이탈리아어, 스페인어, 독일어, 포르투갈어, 튀르키예어까지 10개 언어**를 지원합니다.

> **프로젝트 상태:** 백엔드 없이 동작하는 **데모 프로젝트**입니다. 상품 정보와 가격은 예시 값이고, 환율은 고정값이며, 실제 결제와 배송은 이루어지지 않습니다. 주문 입력값은 어디에도 전송되지 않습니다.

## 화면

사진은 [Unsplash](https://unsplash.com), 아이콘은 [Flaticon UIcons](https://www.flaticon.com/uicons)에서 가져왔습니다. 출처는 사이트의 출처 페이지에 있습니다.

| 첫 화면 | 카테고리 쇼케이스 |
|---|---|
| ![DESSERT LAND 글자 앞에 요리사가 서 있고 주변에 디저트 사진이 떠 있는 첫 화면](docs/images/home-hero.jpg) | ![흐린 팬케이크 사진을 배경으로 선명한 사진과 팬케이크 제목이 놓인 화면](docs/images/home-category.jpg) |

| 글자 마스크 줌 | 세계 디저트 여행 |
|---|---|
| ![어두운 화면의 SWEET 글자 안으로 케이크 사진이 보이는 장면](docs/images/home-zoom.jpg) | ![국가와 좌표, 가격이 적힌 디저트 카드가 가로로 이어지는 화면](docs/images/home-world.jpg) |

| 상품 목록 | 상품 상세(일본어) |
|---|---|
| ![가운데 상품을 강조하고 왼쪽에 그 상품 사진을 보여 주는 목록](docs/images/shop.jpg) | ![일본어로 표시된 쇼트케이크 상세 정보와 엔화 가격](docs/images/product-ja.jpg) |

| 장바구니(일본어) | 모바일 |
|---|---|
| ![오른쪽에서 열린 장바구니와 수량, 합계, 주문 버튼](docs/images/cart-ja.jpg) | <img src="docs/images/mobile-hero.jpg" alt="모바일 첫 화면의 제목과 요리사, 소개 문구" width="240"> |

## 주요 기능

| 구분 | 내용 |
|---|---|
| 전 세계 디저트 | 밀크셰이크, 치즈케이크, 머핀, 팬케이크, 생크림 케이크, 세계의 명작 등 13개 나라의 16종 |
| 10개 언어 | ko(기본), en, ja, zh, fr, it, es, de, pt, tr. 언어별 URL, 통화, 국가 이름, 숫자 표시 |
| 쇼핑 | 카테고리 필터, 상품 상세, 장바구니(저장 유지), 데모 주문 |
| 인물 인터랙션 | 마우스 위치에 따라 가운데 요리사가 돌아보고 빛이 바뀌는 WebGL 2.5D 시차 |
| 커서 | 따라오는 링, 흩날리는 스프링클, 끌어당기는 버튼, 지나간 자리에 피어나는 사진 |
| 스크롤 | 원형으로 열리는 장면 전환, 글자 마스크 줌, 가로 스크롤 여행, 단어별 밝아짐, 패럴랙스 |
| 접근성 | 모션 멈춤 버튼, `prefers-reduced-motion` 대응, 키보드 초점 시 장면 이동, 본문 바로가기 |

## 기술 스택

![React, Next.js, TypeScript, pnpm, Vitest, Storybook, Playwright, GitHub Actions](https://skillicons.dev/icons?i=react,nextjs,ts,pnpm,vitest,storybook,githubactions)

| 구분 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Panda CSS |
| 상태 | jotai |
| 다국어 | next-intl |
| 모션 | GSAP(ScrollTrigger), Lenis, OGL(WebGL) |
| 품질 | ESLint, Vitest, Testing Library, Storybook 10, Playwright, axe |
| 구조 | Feature-Sliced Design |

## 시작하기

Node.js 22(`.nvmrc`)와 pnpm이 필요합니다.

```bash
corepack enable pnpm
pnpm install
pnpm dev    # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `pnpm build` / `pnpm start` | 프로덕션 빌드와 실행 |
| `pnpm typecheck` / `pnpm lint` | 타입 검사와 린트 |
| `pnpm test` | 단위 테스트 |
| `pnpm e2e` | 프로덕션 빌드 기준 E2E와 접근성 검사(`pnpm build` 후 실행) |
| `pnpm storybook` | 컴포넌트 문서 |

## 프로젝트 구조

```
src/
├─ app/[locale]/   # 라우트. _pages를 다시 내보냅니다.
├─ proxy.ts        # 언어 라우팅
├─ _app/           # 레이아웃, 프로바이더, 전역 스타일
├─ _pages/         # 홈, 목록, 상세, 주문, 출처
├─ widgets/        # 히어로, 쇼케이스, 커서, 장바구니 등
├─ features/       # 담기, 언어 변경, 모션 멈춤, 주문 폼
├─ entities/       # 상품 카탈로그, 장바구니
└─ shared/         # 다국어, 모션, UI
```

## 문서

| 문서 | 내용 |
|---|---|
| [개발 가이드](docs/development.md) | 언어와 상품 추가, 모션 규칙, 사진과 아이콘 라이선스 |
| [변경 기록](CHANGELOG.md) | 버전별 변경 사항 |
