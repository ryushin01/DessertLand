import type { MetadataRoute } from "next";

import { PRODUCTS } from "@/entities/product";
import { SITE_URL } from "@/shared/config";
import { LOCALES, localeAlternates } from "@/shared/i18n";

const PATHS = ["", "/shop", "/credits", ...PRODUCTS.map(({ slug }) => `/shop/${slug}`)] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: {
        languages: localeAlternates(locale, path as "" | `/${string}`)?.languages as Record<
          string,
          string
        >,
      },
    })),
  );
}
