import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/shared/config";

import { DEFAULT_LOCALE, LOCALES } from "./routing";

type Path = "" | `/${string}`;

/** 검색 엔진에 언어별 주소와 대표 주소를 알립니다. */
export function localeAlternates(locale: string, path: Path = ""): Metadata["alternates"] {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((code) => [code, `${SITE_URL}/${code}${path}`])),
      "x-default": `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
    },
  };
}

/** 하위 페이지의 openGraph는 상위 값을 대체하므로 공통 값을 함께 넣습니다. */
export function siteOpenGraph(
  title: string,
  description?: string,
): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  };
}
