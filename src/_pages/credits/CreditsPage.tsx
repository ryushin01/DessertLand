import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { css } from "styled-system/css";

import { HERO_CREDIT, PRODUCTS, type PhotoCredit } from "@/entities/product";
import { localeAlternates, siteOpenGraph } from "@/shared/i18n";

type CreditsPageProps = { params: Promise<{ locale: string }> };

const page = css({
  paddingBlock: "110px 72px",
  paddingInline: { base: "16px", md: "28px" },
  maxWidth: "960px",
  marginInline: "auto",
});
const title = css({ fontFamily: "display", fontSize: "clamp(2.6rem, 7vw, 6rem)", lineHeight: "1", marginBlockEnd: "32px", wordBreak: "var(--word-break)" });
const heading = css({ fontFamily: "display", fontSize: "2rem", marginBlock: "32px 12px" });
const item = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: "4px 20px",
  paddingBlock: "10px",
  borderBlockEnd: "1px solid {colors.cocoa.800}",
});
const link = css({ textDecoration: "underline", textUnderlineOffset: "3px", _hover: { color: "caramel" } });

export async function generateMetadata({ params }: CreditsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "credits" });
  const title = `${t("metaTitle")} | Dessert Land`;
  return {
    title,
    alternates: localeAlternates(locale, "/credits"),
    openGraph: siteOpenGraph(title),
  };
}

export default async function CreditsPage({ params }: CreditsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreditsContent />;
}

function CreditItem({ label, credit }: { label: string; credit: PhotoCredit }) {
  const t = useTranslations("credits");
  return (
    <li className={item}>
      <span>{label}</span>
      <a className={link} href={credit.photoUrl} rel="noreferrer">
        {t("by", { name: credit.name })}
      </a>
    </li>
  );
}

function CreditsContent() {
  const t = useTranslations("credits");
  const tProducts = useTranslations("products");
  return (
    <div className={page}>
      <h1 className={title}>{t("title")}</h1>
      <h2 className={heading}>{t("photos")}</h2>
      <ul>
        <CreditItem label={t("hero")} credit={HERO_CREDIT} />
        {PRODUCTS.map((product) => (
          <CreditItem
            key={product.slug}
            label={tProducts(`${product.slug}.name` as Parameters<typeof tProducts>[0]) as string}
            credit={product.credit}
          />
        ))}
      </ul>
      <h2 className={heading}>{t("icons")}</h2>
      <p>
        <a className={link} href="https://www.flaticon.com/uicons" rel="noreferrer" lang="en">
          Uicons by Flaticon
        </a>
      </p>
    </div>
  );
}
