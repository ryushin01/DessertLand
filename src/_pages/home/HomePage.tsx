import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localeAlternates, siteOpenGraph } from "@/shared/i18n";
import { CategoryShowcase } from "@/widgets/category-showcase";
import { Hero } from "@/widgets/hero";
import { IntroCurtain } from "@/widgets/intro-curtain";
import { Manifesto } from "@/widgets/manifesto";
import { SliceZoom } from "@/widgets/slice-zoom";
import { SweetTrail } from "@/widgets/sweet-trail";
import { WorldTour } from "@/widgets/world-tour";

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = `Dessert Land — ${t("title")}`;
  const description = t("description");
  return {
    title,
    description,
    alternates: localeAlternates(locale),
    openGraph: siteOpenGraph(title, description),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <IntroCurtain />
      <Hero />
      <Manifesto />
      <CategoryShowcase />
      <SliceZoom />
      <WorldTour />
      <SweetTrail />
    </>
  );
}
