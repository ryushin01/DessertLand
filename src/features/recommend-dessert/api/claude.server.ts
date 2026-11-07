import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { parsePartialJson } from "../lib/partial-json";
import { requiredExclusions, sanitizeRecommendation } from "../lib/recommend";
import type { RawRecommendation, RecommendRequest, Recommendation } from "../model/types";
import { RECOMMENDATION_SCHEMA, buildUserMessage } from "./prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

export function isClaudeEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type StreamInput = {
  request: RecommendRequest;
  system: string;
  signal: AbortSignal;
  onUpdate: (recommendation: Recommendation) => void;
};

/** 추천을 스트리밍합니다. 끝까지 쓸 수 있는 결과를 얻지 못하면 null을 돌려줍니다. */
export async function streamRecommendation({
  request,
  system,
  signal,
  onUpdate,
}: StreamInput): Promise<Recommendation | null> {
  const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const exclusions = requiredExclusions(request.chips);
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      // 응답이 짧은 작업이라 비용 상한을 겸해 낮게 둡니다.
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: RECOMMENDATION_SCHEMA as never },
      },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(request) }],
    },
    { signal },
  );

  let text = "";
  let lastSent = "";
  for await (const event of stream) {
    if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
    text += event.delta.text;
    const partial = parsePartialJson(text) as RawRecommendation | null;
    const next = sanitizeRecommendation(partial, exclusions);
    const serialized = JSON.stringify(next);
    if (serialized !== lastSent) {
      lastSent = serialized;
      onUpdate(next);
    }
  }

  const message = await stream.finalMessage();
  console.info("추천 사용량", {
    model: message.model,
    stop: message.stop_reason,
    input: message.usage.input_tokens,
    cacheRead: message.usage.cache_read_input_tokens,
    output: message.usage.output_tokens,
  });
  if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens") return null;
  try {
    return sanitizeRecommendation(JSON.parse(text) as RawRecommendation, exclusions);
  } catch {
    return null;
  }
}
