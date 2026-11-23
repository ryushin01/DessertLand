import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { css } from "styled-system/css";

import { notFound } from "next/navigation";

import { CATEGORIES, getProductsByCategory, isCategory, type Category } from "@/entities/product";
import { productTastes } from "@/entities/product/index.server";
import { LOCALES, Link, localeAlternates, siteOpenGraph } from "@/shared/i18n";
import { SectionHeading } from "@/shared/ui";
import { RevealText } from "@/shared/ui/reveal-text";
import { ShopBrowser } from "./ShopBrowser";
import { pill, pillList } from "./pill";

type ShopPageProps = { params: Promise<{ locale: string }> };
type ShopCategoryPageProps = { params: Promise<{ locale: string; category: string }> };

const head = css({
  position: "relative",
  zIndex: 2,
  paddingBlockStart: { base: "120px", md: "160px" },
  paddingInline: { base: "16px", md: "56px" },
  display: "grid",
  gap: "20px",
  // 제목의 가로 기준선을 화면 너비에서 자릅니다(문서가 가로로 넘치지 않게).
  overflowX: "clip",
});
const title = css({
  fontFamily: "display",
  fontSize: "clamp(2.6rem, 6.4vw, 6.4rem)",
  fontWeight: "200",
  lineHeight: "1.05",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
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
  const products = getProductsByCategory(active);
  const tastesBySlug = Object.fromEntries(products.map(({ slug }) => [slug, productTastes(slug)]));

  return (
    <>
      <div className={head}>
        <SectionHeading index={2}>
          <RevealText as="h1" text={t("title")} className={title} immediate />
        </SectionHeading>
        <nav aria-label={t("filter")}>
          <ul className={pillList}>
            <li>
              <Link
                href="/shop"
                scroll={false}
                className={pill}
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
                  className={pill}
                  aria-current={active === category ? "page" : undefined}
                >
                  {tCategories(`${category}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <ShopBrowser
        key={active ?? "all"}
        products={products}
        tastesBySlug={tastesBySlug}
        categoryKey={active ?? "all"}
      />
    </>
  );
}
