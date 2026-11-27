import { HttpResponse, http } from "msw";

import { MOCK_RECOMMENDATION } from "../fixtures";
import { chunkedStream, splitText } from "../stream";

/**
 * Claude API(Messages, 스트리밍 SSE) 목업. 서버의 추천(`@anthropic-ai/sdk`의 messages.stream)이 받는 이벤트 순서
 * (message_start → content_block_start → content_block_delta 여러 번 → content_block_stop → message_delta → message_stop)를
 * 그대로 흉내 내고, JSON 결과를 12글자씩 잘라 조각마다 늦춰 보냅니다. 비용이 드는 실제 호출은 하지 않습니다.
 */
const event = (type: string, data: unknown) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

export function claudeSseChunks(text: string = JSON.stringify(MOCK_RECOMMENDATION)): string[] {
  return [
    event("message_start", {
      type: "message_start",
      message: {
        id: "msg_msw_mock",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 1, cache_read_input_tokens: 0 },
      },
    }),
    event("content_block_start", {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    }),
    ...splitText(text, 12).map((part) =>
      event("content_block_delta", {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: part },
      }),
    ),
    event("content_block_stop", { type: "content_block_stop", index: 0 }),
    event("message_delta", {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 120 },
    }),
    event("message_stop", { type: "message_stop" }),
  ];
}

export const claudeHandlers = [
  http.post(
    "https://api.anthropic.com/v1/messages",
    () =>
      new HttpResponse(chunkedStream(claudeSseChunks(), 20), {
        headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
      }),
  ),
];
