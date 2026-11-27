import wretch from "wretch";
import AbortAddon from "wretch/addons/abort";

/**
 * 앱 공통 HTTP 클라이언트(Wretch). 요청마다 `.url()`로 주소를 붙여 씁니다.
 * 취소가 필요한 요청은 `.signal(controller)`, 시간 제한은 `.options({ signal: AbortSignal.timeout(ms) })`를 씁니다.
 */
export const http = wretch().addon(AbortAddon());

/**
 * Wretch는 2xx가 아닌 응답을 WretchError로 던집니다. 상태 코드를 직접 보고 싶을 때
 * `.res().catch(keepResponse)`로 쓰면 그 응답을 그대로 돌려받습니다. 네트워크 오류·취소는 그대로 던집니다.
 */
export function keepResponse(error: unknown): Response {
  if (error instanceof wretch.WretchError) return error.response;
  throw error;
}
