"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useSyncExternalStore } from "react";

import { DEMO_MODE } from "@/shared/config";

import { OVERRIDES_KEY, parseCatalogOverrides, type CatalogOverrides } from "./overrides";

const EMPTY: CatalogOverrides = {};
let cache: { raw: string | null; value: CatalogOverrides } = { raw: null, value: EMPTY };

/** 저장값이 바뀌지 않았으면 같은 객체를 돌려줘 다시 그리지 않습니다. 데모가 꺼진 빌드는 늘 빈 값입니다. */
function read(): CatalogOverrides {
  if (!DEMO_MODE) return EMPTY;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(OVERRIDES_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cache.raw) {
    let value = EMPTY;
    try {
      value = raw ? parseCatalogOverrides(JSON.parse(raw)) : EMPTY;
    } catch {
      // 손댄 값은 무시하고 원래 상품을 보여 줍니다.
    }
    cache = { raw, value };
  }
  return cache.value;
}

function subscribe(callback: () => void) {
  // 다른 탭(어드민)에서 고치면 이 탭의 쇼핑몰도 바로 바뀝니다. 쓰는 쪽은 어드민(entities/admin-catalog)입니다.
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** 어드민 수정값. 서버 렌더링과 하이드레이션 중에는 빈 값이라 정적 페이지와 어긋나지 않습니다. */
export const useCatalogOverrides = (): CatalogOverrides =>
  useSyncExternalStore(subscribe, read, () => EMPTY);

/** 상품 이름: 어드민이 이 언어로 고친 이름이 있으면 그것, 없으면 메시지 파일의 이름. */
export function useProductName() {
  const t = useTranslations("products");
  const locale = useLocale();
  const overrides = useCatalogOverrides();
  // 목록 거르기(useMemo)의 의존값으로 쓰이므로 재료가 같으면 같은 함수를 돌려줍니다.
  return useCallback(
    (slug: string) =>
      overrides[slug]?.name?.[locale] || (t(`${slug}.name` as Parameters<typeof t>[0]) as string),
    [t, locale, overrides],
  );
}

/**
 * 결제 요청에 함께 보낼 어드민 수정값. 데모가 꺼진 빌드는 undefined라 요청 본문이 그대로입니다.
 * 서버는 데모일 때만 이 값의 가격·할인·숨김으로 금액을 다시 계산합니다(entities/product의 demoPricing).
 */
export const pricingFor = (): CatalogOverrides | undefined => (DEMO_MODE ? read() : undefined);
