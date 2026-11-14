/** 데모용 고정 환율과 통화별 반올림 단위입니다. 실제 서비스에서는 서버 가격으로 바꿉니다. */
const CURRENCIES = {
  USD: { rate: 1, step: 0.5, shipping: 8 },
  KRW: { rate: 1400, step: 100, shipping: 3500 },
  JPY: { rate: 150, step: 10, shipping: 900 },
  CNY: { rate: 7.2, step: 1, shipping: 40 },
  EUR: { rate: 0.9, step: 0.5, shipping: 7 },
  TRY: { rate: 40, step: 5, shipping: 250 },
} as const;

export type Currency = keyof typeof CURRENCIES;

const LOCALE_CURRENCY: Record<string, Currency> = {
  ko: "KRW",
  en: "USD",
  ja: "JPY",
  zh: "CNY",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  de: "EUR",
  pt: "EUR",
  tr: "TRY",
};

export function currencyForLocale(locale: string): Currency {
  return LOCALE_CURRENCY[locale] ?? "USD";
}

export function priceInCurrency(priceUsd: number, currency: Currency): number {
  const { rate, step } = CURRENCIES[currency];
  return Math.round((priceUsd * rate) / step) * step;
}

export function shippingInCurrency(currency: Currency): number {
  return CURRENCIES[currency].shipping;
}

export function formatMoney(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyForLocale(locale),
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatProductPrice(priceUsd: number, locale: string): string {
  return formatMoney(priceInCurrency(priceUsd, currencyForLocale(locale)), locale);
}

/** 기원이 여러 나라에 걸치거나 다툼이 있는 디저트의 나라 코드. */
export const OTHER_COUNTRY = "XX";

const OTHER_LABELS: Record<string, string> = {
  ko: "기타",
  en: "Other",
  ja: "その他",
  zh: "其他",
  fr: "Autre",
  it: "Altro",
  es: "Otro",
  de: "Sonstige",
  pt: "Outro",
  tr: "Diğer",
};

export function countryName(code: string, locale: string): string {
  if (code === OTHER_COUNTRY) return OTHER_LABELS[locale] ?? OTHER_LABELS.en!;
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}
