import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { retrievePaidOrder } from "@/features/stripe-checkout/index.server";

import { CompleteView } from "./CompleteView";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: `${t("metaTitle")} | Dessert Land`, robots: { index: false } };
}

export default async function CheckoutCompletePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session_id: sessionId } = await searchParams;
  const order = typeof sessionId === "string" ? await retrievePaidOrder(sessionId, locale) : null;
  return <CompleteView order={order} />;
}
