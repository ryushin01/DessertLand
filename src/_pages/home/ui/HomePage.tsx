import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localeAlternates, siteOpenGraph } from "@/shared/i18n";
import { CategoryShowcase } from "./CategoryShowcase";
import { DessertAdvisor } from "./DessertAdvisor";
import { Hero } from "./Hero";
import { IntroCurtain } from "./IntroCurtain";
import { Manifesto } from "./Manifesto";
import { SliceZoom } from "./SliceZoom";
import { SweetTrail } from "./SweetTrail";
import { WorldTour } from "./WorldTour";

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
      <DessertAdvisor />
      <SweetTrail />
    </>
  );
}
