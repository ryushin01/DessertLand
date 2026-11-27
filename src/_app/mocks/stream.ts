import { delay } from "msw";

const encoder = new TextEncoder();

/**
 * 조각(chunk)을 하나씩 늦춰 흘려보내는 응답 본문. 실제 서버처럼 한 줄이 여러 조각으로 나뉘어 오게 해,
 * 받는 쪽이 조각을 이어 붙여 읽는지 확인합니다. 브라우저(Service Worker)와 Node 모두에서 씁니다.
 */
export function chunkedStream(chunks: readonly string[], gapMs = 30): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await delay(gapMs);
      }
      controller.close();
    },
  });
}

/** 글을 size 글자씩 자릅니다(스트리밍 흉내). */
export const splitText = (text: string, size: number): string[] =>
  Array.from({ length: Math.ceil(text.length / size) }, (_, index) =>
    text.slice(index * size, (index + 1) * size),
  );
