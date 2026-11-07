import "@/_app/styles/global.css";

import type { Metadata, Viewport } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Serif_JP,
  Noto_Serif_KR,
  Noto_Serif_SC,
} from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { AppProviders } from "@/_app/providers/AppProviders";
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

const koSans = Noto_Sans_KR({ subsets: ["latin"], preload: false, variable: "--font-cjk-sans" });
const koSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: "500",
  preload: false,
  variable: "--font-cjk-serif",
});
const jaSans = Noto_Sans_JP({ subsets: ["latin"], preload: false, variable: "--font-cjk-sans" });
const jaSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: "500",
  preload: false,
  variable: "--font-cjk-serif",
});
const zhSans = Noto_Sans_SC({ subsets: ["latin"], preload: false, variable: "--font-cjk-sans" });
const zhSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: "500",
  preload: false,
  variable: "--font-cjk-serif",
});

const CJK_FONTS: Record<string, string> = {
  ko: `${koSans.variable} ${koSerif.variable}`,
  ja: `${jaSans.variable} ${jaSerif.variable}`,
  zh: `${zhSans.variable} ${zhSerif.variable}`,
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
    title: `Dessert World — ${t("title")}`,
    description: t("description"),
    icons: { icon: "/favicon.svg" },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html
      lang={locale}
      data-motion="on"
      className={`${display.variable} ${body.variable} ${CJK_FONTS[locale] ?? ""}`}
    >
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
