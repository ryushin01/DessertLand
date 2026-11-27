import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminEntry } from "@/features/admin-auth";
import { adminAuthConfig } from "@/features/admin-auth/index.server";

export const loginMetadata: Metadata = { title: "들어가기" };

/** 어드민 들어가기. 쓸 수 있는 방법(데모 버튼·비밀번호)은 서버 설정으로 정합니다(비밀번호 값은 넘기지 않음). */
export function LoginPage() {
  const config = adminAuthConfig();
  return (
    <Suspense>
      <AdminEntry demo={config.demo} passwordEnabled={config.password !== undefined} />
    </Suspense>
  );
}
