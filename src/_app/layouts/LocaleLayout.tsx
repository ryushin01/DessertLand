import "@/_app/styles/global.css";

import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
import { css } from "styled-system/css";

import { AppProviders } from "@/_app/providers/AppProviders";
import { SITE_NAME, SITE_URL } from "@/shared/config";
import { LOCALES, routing } from "@/shared/i18n";
import { Grain } from "@/shared/ui";
import { CartDrawer } from "@/widgets/cart-drawer";
import { CustomCursor } from "@/widgets/custom-cursor";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";
import { SmoothScroll } from "@/widgets/smooth-scroll";

const display = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-display",
});
const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body" });

// next/font로 함께 선언하면 모든 언어에 CSS가 붙어 렌더링을 막으므로, 그 언어의 글꼴만 따로 받습니다.
const CJK_FONTS: Record<string, { sans: string; serif: string }> = {
  ko: { sans: "Noto Sans KR", serif: "Noto Serif KR" },
  ja: { sans: "Noto Sans JP", serif: "Noto Serif JP" },
  zh: { sans: "Noto Sans SC", serif: "Noto Serif SC" },
};

function cjkStylesheet({ sans, serif }: { sans: string; serif: string }): string {
  const family = (name: string, axis: string) => `family=${name.replaceAll(" ", "+")}:wght@${axis}`;
  return `https://fonts.googleapis.com/css2?${family(sans, "400;500;700")}&${family(serif, "500")}&display=swap`;
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
            <SmoothScroll />
            <SiteHeader />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
            <CartDrawer />
            <CustomCursor />
            <Grain />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
