import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { parseBuyNow } from "@/features/buy-now";

import { CheckoutView } from "./CheckoutView";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ buy?: string | string[]; qty?: string | string[] }>;
};

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: `${t("metaTitle")} | Dessert Land`, robots: { index: false } };
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { buy, qty } = await searchParams;
  return <CheckoutView buyNow={parseBuyNow(buy, qty)} />;
}
