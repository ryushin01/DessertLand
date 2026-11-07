import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CheckoutView } from "./CheckoutView";

type CheckoutPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: `${t("metaTitle")} | Dessert World`, robots: { index: false } };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CheckoutView />;
}
