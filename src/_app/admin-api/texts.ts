import { NextResponse, type NextRequest } from "next/server";
import { getMessages } from "next-intl/server";

import { LOCALES } from "@/shared/i18n/index.server";

type ProductTexts = Record<string, { name: string; description: string }>;

const isProductTexts = (value: unknown): value is ProductTexts =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * 어드민 상품 편집이 읽는 언어별 상품 이름·설명 원문(메시지 파일). 쇼핑몰에 이미 공개된 문구라 인증 없이 돌려줍니다.
 * 10개 언어 메시지 파일을 어드민 JS 번들(약 120 kB)에 싣지 않으려고 서버에서 그 언어만 보냅니다(같은 출처라 오프라인에서도 동작).
 */
export async function textsGET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? "";
  if (!LOCALES.includes(locale as never)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  const messages = await getMessages({ locale });
  const products = messages.products;
  return NextResponse.json(
    { status: "ok", products: isProductTexts(products) ? products : {} },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}
