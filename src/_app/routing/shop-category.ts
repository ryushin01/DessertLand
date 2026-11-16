import { resolveCategoryParam } from "@/entities/product";
import { LOCALES } from "@/shared/i18n/index.server";

const SHOP = /^\/([a-z]{2})\/shop\/?$/;

const isLocale = (value: string | undefined): value is string =>
  LOCALES.includes(value as (typeof LOCALES)[number]);

/**
 * 분류별 상품 목록은 미리 만든 정적 페이지 /[locale]/shop/category/[category]입니다.
 * 0.6.x까지 쓰던 /[locale]/shop?category=<분류> 주소는 그 페이지로, 0.5.0 이전의 분류(?category=muffin 등)는
 * 가장 가까운 새 분류로 넘깁니다. 넘길 곳이 없으면 null입니다.
 */
export function shopCategoryRedirect(url: URL): URL | null {
  const shop = SHOP.exec(url.pathname);
  const value = url.searchParams.get("category");
  if (!shop || !isLocale(shop[1]) || value === null) return null;
  const resolved = resolveCategoryParam(value);
  if (resolved.type === "unknown") return null;
  const path = resolved.category
    ? `/${shop[1]}/shop/category/${resolved.category}`
    : `/${shop[1]}/shop`;
  const next = new URL(path, url);
  for (const [key, param] of url.searchParams) {
    if (key !== "category") next.searchParams.append(key, param);
  }
  return next;
}
