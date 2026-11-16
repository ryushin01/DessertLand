import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { css } from "styled-system/css";

import { notFound } from "next/navigation";

import { CATEGORIES, getProductsByCategory, isCategory, type Category } from "@/entities/product";
import { LOCALES, Link, localeAlternates, siteOpenGraph } from "@/shared/i18n";
import { RevealText } from "@/shared/ui/reveal-text";
import { ProductScroller } from "./ProductScroller";

type ShopPageProps = { params: Promise<{ locale: string }> };
type ShopCategoryPageProps = { params: Promise<{ locale: string; category: string }> };

const head = css({
  position: "relative",
  zIndex: 2,
  paddingBlockStart: "100px",
  paddingInline: { base: "16px", md: "28px" },
  display: "grid",
  gap: "20px",
});
const title = css({
  fontFamily: "display",
  fontSize: "clamp(3.2rem, 11vw, 12rem)",
  lineHeight: "0.95",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
});
const advisorLink = css({
  display: "inline-block",
  paddingBlock: "8px",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  _hover: { color: "caramel" },
});
const filters = css({ display: "flex", flexWrap: "wrap", gap: "8px" });
const filter = css({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "44px",
  paddingInline: "16px",
  borderRadius: "999px",
  border: "1px solid {colors.muted}",
  fontSize: "0.9rem",
  transition: "background 0.3s, color 0.3s",
  _hover: { background: "cocoa.800" },
  // 마우스를 올려도 현재 분류의 밝은 바탕을 유지합니다(어두운 바탕에 어두운 글자가 되지 않게).
  "&[aria-current=page]": {
    background: "cream",
    color: "cocoa.950",
    borderColor: "cream",
    _hover: { background: "cream" },
  },
});

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  const title = `${t("metaTitle")} | Dessert Land`;
  return { title, alternates: localeAlternates(locale, "/shop"), openGraph: siteOpenGraph(title) };
}

export async function generateCategoryMetadata({ params }: ShopCategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isCategory(category)) return {};
  const t = await getTranslations({ locale, namespace: "shop" });
  const tCategories = await getTranslations({ locale, namespace: "categories" });
  const title = `${tCategories(`${category}.name`)} · ${t("metaTitle")} | Dessert Land`;
  return {
    title,
    description: tCategories(`${category}.lede`),
    alternates: localeAlternates(locale, `/shop/category/${category}`),
    openGraph: siteOpenGraph(title, tCategories(`${category}.lede`)),
  };
}

/**
 * 상품 목록은 요청마다 그리지 않도록 정적으로 만듭니다. 분류별 목록도 미리 만든 페이지(ShopCategoryPage)이고,
 * 예전 ?category= 주소는 proxy가 그 페이지로 넘깁니다(`_app/routing/shop-category.ts`).
 */
export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShopContent />;
}

export function generateCategoryStaticParams() {
  return LOCALES.flatMap((locale) => CATEGORIES.map((category) => ({ locale, category })));
}

export async function ShopCategoryPage({ params }: ShopCategoryPageProps) {
  const { locale, category } = await params;
  if (!isCategory(category)) notFound();
  setRequestLocale(locale);
  return <ShopContent active={category} />;
}

function ShopContent({ active }: { active?: Category }) {
  const t = useTranslations("shop");
  const tCategories = useTranslations("categories");
  const tAdvisor = useTranslations("advisor");
  const products = getProductsByCategory(active);

  return (
    <>
      <div className={head}>
        <RevealText as="h1" text={t("title")} className={title} immediate />
        <nav aria-label={t("filter")}>
          <ul className={filters}>
            <li>
              <Link
                href="/shop"
                scroll={false}
                className={filter}
                aria-current={active ? undefined : "page"}
              >
                {t("all")}
              </Link>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  href={`/shop/category/${category}`}
                  scroll={false}
                  className={filter}
                  aria-current={active === category ? "page" : undefined}
                >
                  {tCategories(`${category}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p role="status">{t("results", { count: products.length })}</p>
        <p>
          <Link href="/#advisor" className={advisorLink}>
            {tAdvisor("shopLink")}
          </Link>
        </p>
      </div>
      <ProductScroller key={active ?? "all"} products={products} />
    </>
  );
}
