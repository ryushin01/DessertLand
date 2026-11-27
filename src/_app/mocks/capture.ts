/** 테스트용: 목업이 받은 요청을 기록합니다(주소·메서드·헤더·본문). 본문은 한 번만 읽을 수 있어 복사본을 읽습니다. */
export type CapturedRequest = {
  path: string;
  method: string;
  contentType: string | null;
  body: string;
};

export function captureRequests() {
  const calls: CapturedRequest[] = [];
  const capture = async (request: Request) => {
    calls.push({
      path: new URL(request.url).pathname,
      method: request.method,
      contentType: request.headers.get("content-type"),
      body: await request.clone().text(),
    });
  };
  return { calls, capture };
}
