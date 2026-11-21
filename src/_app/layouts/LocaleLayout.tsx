import "@/_app/styles/global.css";
// 한국어 본문: 하다 바탕 중 화면에 쓰는 글자만 담은 파일(pnpm fonts로 만듦). 한글이 없는 언어에서는 받지 않습니다.
import "@/_app/styles/fonts/hada-batang.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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

// 영문·숫자는 제목과 본문 모두 붓맛이 남은 세리프 Lora(가변 400~700).
// 빌드와 화면 모두 외부 글꼴 서버 없이 동작하도록 Fontsource 패키지의 파일을 next/font/local로 씁니다.
// 기본 라틴과 확장 라틴(튀르키예어 ğ·ş 등)을 두 글꼴로 나누고 unicode-range를 붙여, 필요한 글자가 있을 때만 받습니다.
// next/font는 빌드 때 인수를 그대로 읽으므로 범위를 상수로 빼지 않고 글자 그대로 적습니다.
const loraLatin = localFont({
  src: "../../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
  // 바로 뒤의 확장 라틴 글꼴로 넘어가야 하므로 대체 글꼴(Fallback)을 붙이지 않습니다.
  adjustFontFallback: false,
});
const loraLatinExt = localFont({
  src: "../../../node_modules/@fontsource-variable/lora/files/lora-latin-ext-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});
const LORA_FAMILY = `${loraLatin.style.fontFamily}, ${loraLatinExt.style.fontFamily}`;

// next/font로 함께 선언하면 모든 언어에 CSS가 붙어 렌더링을 막으므로, 그 언어의 글꼴만 따로 받습니다.
// 한국어는 꽃잎 같은 획의 그란디플로라 원(제목)과 하다 바탕(본문, 400·700). 하다 바탕은 별도 파일(hada-batang.css)이고,
// 일본어는 장식 명조 Kaisei Decol(제목)과 둥근 Zen Maru Gothic(본문), 중국어는 Noto Sans·Serif SC입니다.
// 한중일 글꼴은 외부 글꼴 서버 대신 설치 때(prepare) Fontsource 패키지에서 public/fonts/cjk로 복사한 파일을 씁니다
// (scripts/copy-cjk-fonts.mjs). 그래서 오프라인에서도 같은 글꼴로 보입니다.
type CjkFonts = { sans: string; serif: string };
const CJK_FONTS: Record<string, CjkFonts> = {
  ko: { sans: "Hada Batang", serif: "Grandiflora One" },
  ja: { sans: "Zen Maru Gothic", serif: "Kaisei Decol" },
  zh: { sans: "Noto Sans SC", serif: "Noto Serif SC" },
};

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
      style={
        {
          "--font-lora": LORA_FAMILY,
          ...(cjk
            ? { "--font-cjk-sans": `"${cjk.sans}"`, "--font-cjk-serif": `"${cjk.serif}"` }
            : {}),
        } as CSSProperties
      }
    >
      <head>{cjk ? <link rel="stylesheet" href={`/fonts/cjk/${locale}.css`} /> : null}</head>
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
