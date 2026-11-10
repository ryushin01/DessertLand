import createMiddleware from "next-intl/middleware";

import { routing } from "@/shared/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // storybook: 앱과 함께 배포한 Storybook은 언어 주소로 보내지 않습니다.
  matcher: ["/((?!api|_next|_vercel|storybook|.*\\..*).*)"],
};
