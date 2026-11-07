import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { css } from "styled-system/css";

import { CATEGORIES, getProductsByCategory, isCategory, type Category } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { RevealText } from "@/shared/ui";
import { ProductScroller } from "@/widgets/product-scroller";

type ShopPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
};

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
  "&[aria-current=page]": { background: "cream", color: "cocoa.950", borderColor: "cream" },
});

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: `${t("metaTitle")} | Dessert Market` };
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { category } = await searchParams;
  const active = isCategory(category) ? category : undefined;
  return <ShopContent active={active} />;
}

function ShopContent({ active }: { active?: Category }) {
  const t = useTranslations("shop");
  const tCategories = useTranslations("categories");
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
                  href={{ pathname: "/shop", query: { category } }}
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
      </div>
      <ProductScroller key={active ?? "all"} products={products} />
    </>
  );
}
