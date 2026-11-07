# 개발 가이드

## 언어 추가

1. `src/shared/i18n/routing.ts`의 `LOCALES`와 `LOCALE_LABELS`에 추가합니다. 지원 언어는 10개 이내로 유지합니다.
2. `src/shared/i18n/messages/ko.json`과 같은 키로 메시지 파일을 추가합니다. 타입은 `ko.json`을 기준으로 검사합니다.
3. `src/entities/product/lib/price.ts`에 통화를 연결합니다.
4. 한자나 가나, 한글처럼 라틴 글꼴에 없는 문자를 쓰면 `src/_app/layouts/LocaleLayout.tsx`에 글꼴을 추가합니다.

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

## 첫 화면 인물

`widgets/hero/chef-renderer.ts`가 컷아웃과 깊이 지도로 시차를 그립니다. WebGL을 쓸 수 없거나 모션이 꺼져 있으면 컷아웃 이미지를 그대로 보여 줍니다. 컷아웃과 깊이 지도는 macOS Vision의 인물 분할 결과로 만들었습니다.

## 라이선스

- **사진:** [Unsplash License](https://unsplash.com/license)의 무료 사진만 씁니다. Unsplash+ 사진은 쓰지 않습니다. 출처는 `catalog.ts`와 `/credits` 페이지에 있습니다. Unsplash 라이선스는 사진 속 인물의 초상권을 보장하지 않으므로, 실제 서비스 전에 첫 화면 인물 사진을 검토합니다.
- **아이콘:** Flaticon UIcons 무료 라이선스는 출처 표기가 필요해 푸터와 `/credits`에 표기합니다. 쓰는 아이콘만 `scripts/build-icons.py`로 추려 냅니다.

## 테스트

- 단위 테스트는 코드 옆의 `*.test.ts(x)`에 둡니다.
- 잘림, 넘침, 접근성은 `pnpm build` 후 `pnpm e2e`로 확인합니다. axe를 통과해도 KWCAG 준수는 아니므로 새 UI는 항목을 직접 점검합니다.
