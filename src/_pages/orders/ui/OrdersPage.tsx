import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { OrdersView } from "./OrdersView";

type OrdersPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return { title: `${t("metaTitle")} | Dessert Land`, robots: { index: false } };
}

/** 이 브라우저에서 한 주문. 목록은 브라우저 저장소에 있으므로 화면은 정적으로 만들고 내용은 브라우저에서 채웁니다. */
export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OrdersView />;
}
