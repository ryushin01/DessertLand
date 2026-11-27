// 어드민 글꼴(무료, 모두 같은 출처 파일): 제목 Bodoni Moda·Noto Serif KR 300, 본문 Pretendard. 쇼핑몰 화면에는 실리지 않습니다.
import "@fontsource-variable/bodoni-moda/index.css";
import "@fontsource/noto-serif-kr/300.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@/_app/styles/admin.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SITE_URL } from "@/shared/config";
import { AdminShell } from "@/widgets/admin-shell";

export const adminMetadata: Metadata = {
  title: { template: "%s | Dessert Land 어드민", default: "Dessert Land 어드민" },
  description: "Dessert Land 관리자 화면(상품·주문·맛과 성분·AI 추천 기록)",
  metadataBase: new URL(SITE_URL),
  // 검색에 나오지 않게 합니다(공개 데모 안내는 README에 있음).
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }] },
};

export const adminViewport: Viewport = { themeColor: "#ffffff" };

/** /admin 아래 모든 화면의 html 뼈대. 쇼핑몰([locale])과 따로 된 루트 레이아웃이라 쇼핑몰 CSS·스크립트를 싣지 않습니다. */
export function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

/** 들어간 뒤의 화면 틀(머리글·데모 안내·바닥글). */
export function AdminConsoleLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
