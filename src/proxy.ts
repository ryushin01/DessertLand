import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { shopCategoryRedirect } from "@/_app/routing/shop-category";
import { routing } from "@/shared/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // 예전 분류 주소(?category=)는 분류별 정적 페이지로 영구 이동합니다.
  const category = shopCategoryRedirect(request.nextUrl);
  if (category) return NextResponse.redirect(category, 308);
  return handleI18nRouting(request);
}

export const config = {
  // storybook: 앱과 함께 배포한 Storybook은 언어 주소로 보내지 않습니다.
  matcher: ["/((?!api|_next|_vercel|storybook|.*\\..*).*)"],
};
