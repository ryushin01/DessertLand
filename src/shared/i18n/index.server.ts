// 서버 코드(API 라우트, 서버 액션)가 쓰는 i18n 공개 API.
// index.ts는 클라이언트 탐색 도우미(navigation)까지 내보내므로, 서버 코드는 언어 목록만 여기서 가져옵니다.
export { LOCALES } from "./routing";
export type { Locale } from "./routing";
