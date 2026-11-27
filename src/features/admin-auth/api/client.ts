import { loadHttp } from "@/shared/api";

export type SignInResult = "ok" | "wrong" | "disabled" | "limited" | "error";

/** 들어가기 요청. 결과는 상태 코드와 관계없이 본문의 status로 판단합니다. */
export async function signIn(
  body: { mode: "demo" } | { mode: "password"; password: string },
): Promise<SignInResult> {
  try {
    const { http, keepResponse } = await loadHttp();
    const response = await http
      .url("/api/admin/session")
      .json(body)
      .post()
      .res()
      .catch(keepResponse);
    const result: unknown = await response.json();
    const status =
      typeof result === "object" && result !== null && "status" in result ? result.status : null;
    return status === "ok" || status === "wrong" || status === "disabled" || status === "limited"
      ? status
      : "error";
  } catch {
    return "error";
  }
}

export async function signOut(): Promise<void> {
  const { http } = await loadHttp();
  await http
    .url("/api/admin/session")
    .delete()
    .res()
    .catch(() => undefined);
}

/** 들어간 뒤 돌아갈 주소. 어드민 안의 주소만 받습니다(다른 사이트로 보내는 열린 이동 방지). */
export function safeNext(value: string | null | undefined): string {
  return value && /^\/admin(?:[/?#]|$)/.test(value) && !value.startsWith("//") ? value : "/admin";
}
