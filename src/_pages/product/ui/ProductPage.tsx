import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { css } from "styled-system/css";

import {
  PRODUCTS,
  currencyForLocale,
  formatProductPrice,
  getProduct,
  priceInCurrency,
  type Product,
} from "@/entities/product";
import { Link, LOCALES, localeAlternates, siteOpenGraph } from "@/shared/i18n";
import { productJsonLd } from "../lib/json-ld";
import { ProductDetail } from "./ProductDetail";

type ProductPageProps = { params: Promise<{ locale: string; slug: string }> };

const related = css({
  paddingBlock: "72px",
  paddingInline: { base: "16px", md: "56px" },
});
const relatedTitle = css({
  fontFamily: "display",
  fontSize: "clamp(2.2rem, 5vw, 4.6rem)",
  marginBlockEnd: "28px",
  wordBreak: "var(--word-break)",
});
const grid = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr 1fr", md: "repeat(3, 1fr)" },
  gap: "20px",
});
const card = css({ display: "block", _hover: { "& img": { transform: "scale(1.06)" } } });
const photo = css({
  position: "relative",
  display: "block",
  aspectRatio: "4 / 3",
  overflow: "hidden",
  borderRadius: "0",
});
const image = css({ objectFit: "cover", transition: "transform 0.9s {easings.silk}" });
const name = css({
  display: "block",
  fontFamily: "display",
  fontSize: "1.6rem",
  lineHeight: "1.2",
  marginBlockStart: "10px",
});

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => PRODUCTS.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: "products" });
  const key = slug as Parameters<typeof t>[0] extends never ? never : string;
  const title = `${t(`${key}.name` as Parameters<typeof t>[0])} | Dessert Land`;
  const description = t(`${key}.description` as Parameters<typeof t>[0]);
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/shop/${slug}`),
    openGraph: siteOpenGraph(title, description),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductContent product={product} />;
}

function ProductContent({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const others = PRODUCTS.filter(
    (item) => item.category === product.category && item.slug !== product.slug,
  );
  const fillers = PRODUCTS.filter(
    (item) => item.category !== product.category && item.country !== product.country,
  );
  const items = [...others, ...fillers].slice(0, 3);

  const productName = tProducts(
    `${product.slug}.name` as Parameters<typeof tProducts>[0],
  ) as string;
  const description = tProducts(
    `${product.slug}.description` as Parameters<typeof tProducts>[0],
  ) as string;
  const currency = currencyForLocale(locale);

  return (
    <>
      <script
        type="application/ld+json"
        // 구조화 데이터는 실행되지 않는 JSON이고, productJsonLd가 "<"를 이스케이프합니다.
        dangerouslySetInnerHTML={{
          __html: productJsonLd({
            slug: product.slug,
            locale,
            name: productName,
            description,
            image: product.image.src,
            price: priceInCurrency(product.priceUsd, currency),
            currency,
          }),
        }}
      />
      <ProductDetail product={product} description={description} />
      <section className={related} aria-labelledby="related-title">
        <h2 id="related-title" className={relatedTitle}>
          {t("related")}
        </h2>
        <ul className={grid}>
          {items.map((item) => (
            <li key={item.slug}>
              <Link href={`/shop/${item.slug}`} className={card}>
                <span className={photo}>
                  <Image
                    unoptimized
                    src={item.image.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className={image}
                  />
                </span>
                <span className={name}>
                  {tProducts(`${item.slug}.name` as Parameters<typeof tProducts>[0]) as string}
                </span>
                <span>{formatProductPrice(item.priceUsd, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
