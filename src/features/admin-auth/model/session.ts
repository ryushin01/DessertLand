/**
 * 어드민 세션 쿠키. 서버(API 라우트)와 proxy(Edge 런타임)가 함께 쓰므로 Web Crypto만 씁니다.
 * - 공개 데모: "관리자로 둘러보기"를 누르면 값 "demo"를 넣습니다(비밀값 없음, 데모 빌드에서만 인정).
 * - 실제 인증: ADMIN_PASSWORD로 서명한 만료 시각(v1.<만료>.<서명>). 비밀번호를 바꾸면 모든 세션이 끝납니다.
 */
export const ADMIN_COOKIE = "dl_admin";
export const DEMO_SESSION = "demo";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AdminAuthConfig = { demo: boolean; password: string | undefined };

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`dessert-land-admin:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

/** 길이가 같아도 앞에서 다른 글자를 만나면 바로 끝나지 않게 끝까지 비교합니다. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1)
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export async function createSessionToken(secret: string, now: number): Promise<string> {
  const expires = String(now + SESSION_TTL_MS);
  return `v1.${expires}.${await sign(secret, expires)}`;
}

/** 쿠키 값이 지금 유효한 어드민 세션인지 봅니다. */
export async function isValidSession(
  token: string | undefined,
  config: AdminAuthConfig,
  now: number,
): Promise<boolean> {
  if (!token) return false;
  if (token === DEMO_SESSION) return config.demo;
  if (!config.password) return false;
  const [version, expires, signature] = token.split(".");
  if (version !== "v1" || !expires || !signature || !/^\d{1,15}$/.test(expires)) return false;
  if (Number(expires) <= now) return false;
  return sameText(signature, await sign(config.password, expires));
}

/** 비밀번호 비교. 두 값을 같은 길이의 서명으로 바꿔 끝까지 비교합니다. */
export async function isPasswordCorrect(input: string, password: string): Promise<boolean> {
  const [a, b] = await Promise.all([sign(password, input), sign(password, password)]);
  return sameText(a, b);
}
