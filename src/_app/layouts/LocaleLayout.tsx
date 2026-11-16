import "@/_app/styles/global.css";
// 한국어 본문: 하다 바탕 중 화면에 쓰는 글자만 담은 파일(pnpm fonts로 만듦). 한글이 없는 언어에서는 받지 않습니다.
import "@/_app/styles/fonts/hada-batang.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Lora } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
import { css } from "styled-system/css";

import { AppProviders } from "@/_app/state/AppProviders";
import { OrderSync } from "@/_app/state/OrderSync";
import { DeferredMotion } from "@/_app/motion/DeferredMotion";
import { MotionAttribute } from "@/_app/motion/MotionAttribute";
import { RestFonts } from "@/_app/layouts/RestFonts";
import { SITE_NAME, SITE_URL } from "@/shared/config";
import { LOCALES, routing } from "@/shared/i18n";
import { pickClientMessages } from "@/shared/i18n/index.server";
import { Grain } from "@/shared/ui";
import { CartDrawer } from "@/widgets/cart-drawer";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";

// 영문·숫자는 제목과 본문 모두 붓맛이 남은 세리프 Lora(가변 400~700)
const lora = Lora({ subsets: ["latin", "latin-ext"], variable: "--font-lora" });

// next/font로 함께 선언하면 모든 언어에 CSS가 붙어 렌더링을 막으므로, 그 언어의 글꼴만 따로 받습니다.
// 한국어는 꽃잎 같은 획의 그란디플로라 원(제목)과 하다 바탕(본문, 400·700). 하다 바탕은 저장소에서 직접 제공하므로
// Google Fonts에서는 제목 글꼴만 받습니다(sansWeights 없음).
// 일본어도 같은 결로 장식 명조 Kaisei Decol(제목)과 둥근 Zen Maru Gothic(본문).
// 중국어는 Google Fonts의 장식 서체가 파일이 커서 Noto를 씁니다.
type CjkFonts = { sans: string; sansWeights?: string; serif: string; serifWeights: string };
const CJK_FONTS: Record<string, CjkFonts> = {
  ko: { sans: "Hada Batang", serif: "Grandiflora One", serifWeights: "400" },
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
  const families = sansWeights ? [family(sans, sansWeights), family(serif, serifWeights)] : [family(serif, serifWeights)];
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
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
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/apple-touch-icon.png",
    },
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
  // 클라이언트에는 쓰는 메시지만 넘깁니다(상품 설명·서버 전용 묶음 제외).
  const messages = pickClientMessages(await getMessages());
  const cjk = CJK_FONTS[locale];

  return (
    <html
      lang={locale}
      data-motion="on"
      className={lora.variable}
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
        <NextIntlClientProvider messages={messages}>
          <AppProviders>
            <a href="#main" className={skipLink}>
              {t("skip")}
            </a>
            <MotionAttribute />
            <OrderSync />
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
        {locale === "ko" ? <RestFonts href="/fonts/hada-batang-rest.css" /> : null}
      </body>
    </html>
  );
}
