// 서버(proxy, 어드민 API 라우트)가 쓰는 어드민 인증 공개 API.
export { DELETE, GET, POST } from "./api/route";
export { adminGate, isAdminPath } from "./api/gate.server";
export { isAdminRequest, isRealAdminRequest } from "./api/guard.server";
export { adminAuthConfig } from "./api/config.server";
