import "@/_app/styles/global.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
import { css } from "styled-system/css";

import { AppProviders } from "@/_app/providers/AppProviders";
import { DeferredMotion } from "@/_app/providers/DeferredMotion";
import { MotionAttribute } from "@/_app/providers/MotionAttribute";
import { SITE_NAME, SITE_URL } from "@/shared/config";
import { LOCALES, routing } from "@/shared/i18n";
import { Grain } from "@/shared/ui";
import { CartDrawer } from "@/widgets/cart-drawer";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";

// 영문 상품명은 파티스리 간판 같은 Playfair Display
const display = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-display",
});
const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body" });

// next/font로 함께 선언하면 모든 언어에 CSS가 붙어 렌더링을 막으므로, 그 언어의 글꼴만 따로 받습니다.
// 한국어는 꽃잎 같은 획의 그란디플로라 원(제목)과 고운돋움(본문). 두 글꼴은 굵기가 400 하나뿐입니다.
// 일본어도 같은 결로 장식 명조 Kaisei Decol(제목)과 둥근 Zen Maru Gothic(본문).
// 중국어는 Google Fonts의 장식 서체가 파일이 커서 Noto를 씁니다.
type CjkFonts = { sans: string; sansWeights: string; serif: string; serifWeights: string };
const CJK_FONTS: Record<string, CjkFonts> = {
  ko: { sans: "Gowun Dodum", sansWeights: "400", serif: "Grandiflora One", serifWeights: "400" },
  ja: {
    sans: "Zen Maru Gothic",
    sansWeights: "400;500;700",
    serif: "Kaisei Decol",
    serifWeights: "500",
  },
  zh: {
    sans: "Noto Sans SC",
    sansWeights: "400;500;700",
    serif: "Noto Serif SC",
    serifWeights: "500",
  },
};

function cjkStylesheet({ sans, sansWeights, serif, serifWeights }: CjkFonts): string {
  const family = (name: string, axis: string) => `family=${name.replaceAll(" ", "+")}:wght@${axis}`;
  return `https://fonts.googleapis.com/css2?${family(sans, sansWeights)}&${family(serif, serifWeights)}&display=swap`;
}

const skipLink = css({
  position: "fixed",
  insetBlockStart: "8px",
  insetInlineStart: "8px",
  zIndex: 100,
  padding: "12px 18px",
  borderRadius: "8px",
  background: "cream",
  color: "cocoa.950",
  transform: "translateY(-200%)",
  _focusVisible: { transform: "translateY(0)" },
});

type LocaleLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export const viewport: Viewport = { themeColor: "#120b0a" };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: `Dessert Land — ${t("title")}`,
    description: t("description"),
    icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
    applicationName: "Dessert Land",
    metadataBase: new URL(SITE_URL),
    // 제목과 설명을 여기 두면 하위 페이지의 공유 미리보기에도 사이트 소개가 나옵니다.
    openGraph: { type: "website", siteName: SITE_NAME, images: ["/og-image.jpg"] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });
  const cjk = CJK_FONTS[locale];

  return (
    <html
      lang={locale}
      data-motion="on"
      className={`${display.variable} ${body.variable}`}
      style={
        cjk
          ? ({
              "--font-cjk-sans": `"${cjk.sans}"`,
              "--font-cjk-serif": `"${cjk.serif}"`,
            } as CSSProperties)
          : undefined
      }
    >
      <head>
        {cjk ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={cjkStylesheet(cjk)} />
          </>
        ) : null}
      </head>
      <body>
        <NextIntlClientProvider>
          <AppProviders>
            <a href="#main" className={skipLink}>
              {t("skip")}
            </a>
            <MotionAttribute />
            <DeferredMotion />
            <SiteHeader />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
            <CartDrawer />
            <Grain />
            <SpeedInsights />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
