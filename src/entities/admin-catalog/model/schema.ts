import { z } from "zod";

import {
  ALLERGENS,
  CATEGORIES,
  MAX_DISCOUNT,
  PRICE_RANGE,
  TASTES,
} from "@/entities/product/@x/admin-catalog";

export const ADMIN_LOCALES = ["ko", "en", "ja", "zh", "fr", "it", "es", "de", "pt", "tr"] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];

export const LOCALE_LABELS: Record<AdminLocale, string> = {
  ko: "한국어",
  en: "영어",
  ja: "일본어",
  zh: "중국어",
  fr: "프랑스어",
  it: "이탈리아어",
  es: "스페인어",
  de: "독일어",
  pt: "포르투갈어",
  tr: "튀르키예어",
};

const localized = (max: number) =>
  z.partialRecord(z.enum(ADMIN_LOCALES), z.string().trim().max(max));

/** 상품 편집 폼. 입력칸의 문자열을 숫자로 바꿔 범위를 확인합니다(오류 문구는 그대로 화면에 보임). */
export const productFormSchema = z.object({
  priceUsd: z.coerce
    .number({ error: "가격을 숫자로 입력해 주세요." })
    .min(PRICE_RANGE.min, { error: `가격은 ${PRICE_RANGE.min}달러 이상이어야 합니다.` })
    .max(PRICE_RANGE.max, { error: `가격은 ${PRICE_RANGE.max}달러 이하여야 합니다.` }),
  discount: z.coerce
    .number({ error: "할인율을 숫자로 입력해 주세요." })
    .int({ error: "할인율은 정수(%)로 입력해 주세요." })
    .min(0, { error: "할인율은 0% 이상이어야 합니다." })
    .max(MAX_DISCOUNT, { error: `할인율은 ${MAX_DISCOUNT}% 이하여야 합니다.` }),
  /** 비우면 수량 제한 없음 */
  stock: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,6}$/.test(value), {
      error: "재고는 0 이상의 정수로 입력하거나, 제한이 없으면 비워 두세요.",
    }),
  hidden: z.boolean(),
  name: localized(80).refine((names) => (names.ko ?? "").length > 0, {
    error: "한국어 이름은 비울 수 없습니다.",
    path: ["ko"],
  }),
  description: localized(600),
  allergens: z.array(z.enum(ALLERGENS)),
  tastes: z.array(z.enum(TASTES)),
});
export type ProductForm = z.infer<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;

/** 새 상품(어드민에서 추가). slug는 주소에 쓰므로 영문 소문자·숫자·하이픈만 받습니다. */
export const newProductSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "영문 소문자·숫자·하이픈(-)으로 입력해 주세요. 예: yuja-tart",
    })
    .max(60, { error: "60자 이하로 입력해 주세요." }),
  nameKo: z.string().trim().min(1, { error: "한국어 이름을 입력해 주세요." }).max(80),
  category: z.enum(CATEGORIES, { error: "분류를 골라 주세요." }),
  country: z.string().regex(/^[A-Z]{2}$/, { error: "나라를 골라 주세요." }),
  priceUsd: z.coerce
    .number({ error: "가격을 숫자로 입력해 주세요." })
    .min(PRICE_RANGE.min, { error: `가격은 ${PRICE_RANGE.min}달러 이상이어야 합니다.` })
    .max(PRICE_RANGE.max, { error: `가격은 ${PRICE_RANGE.max}달러 이하여야 합니다.` }),
  weightGrams: z.coerce
    .number({ error: "중량을 숫자로 입력해 주세요." })
    .int({ error: "중량은 정수(g)로 입력해 주세요." })
    .min(1, { error: "중량은 1g 이상이어야 합니다." })
    .max(5000, { error: "중량은 5,000g 이하여야 합니다." }),
});
export type NewProduct = z.infer<typeof newProductSchema>;

export const customProductSchema = z.object({
  slug: z.string(),
  category: z.enum(CATEGORIES),
  country: z.string().length(2),
  priceUsd: z.number(),
  weightGrams: z.number(),
  createdAt: z.number(),
});
export type CustomProduct = z.infer<typeof customProductSchema>;

/** zod 오류를 입력칸 이름 → 첫 오류 문구로 바꿉니다(name.ko처럼 점으로 잇기). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
