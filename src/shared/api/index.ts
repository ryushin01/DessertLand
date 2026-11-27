// 브라우저 코드용 공개 API. Wretch를 처음 요청할 때 한 번만 따로 받아,
// 여러 화면 청크에 같은 코드가 겹쳐 실리지 않게 합니다(번들 예산). 서버 코드는 index.server.ts를 씁니다.
export const loadHttp = () => import("./http");
