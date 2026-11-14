import { MAX_PICKS, type Pick, type RecommendEvent } from "./types";

const isPick = (value: unknown): value is Pick =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Pick).slug === "string" &&
  typeof (value as Pick).reason === "string";

/**
 * 스트림의 한 줄을 이벤트로 읽습니다. JSON이 아니거나 모양이 다르면 null.
 * 받은 추천을 그대로 그리면 형식이 어긋났을 때 화면이 깨지므로 먼저 확인합니다.
 */
export function parseRecommendEvent(line: string): RecommendEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const event = value as Record<string, unknown>;
  if (event.type === "error") return { type: "error" };
  if (event.type !== "update" && event.type !== "done") return null;
  if (typeof event.intro !== "string" || !Array.isArray(event.picks) || !event.picks.every(isPick))
    return null;
  const base = { intro: event.intro, picks: event.picks.slice(0, MAX_PICKS) };
  if (event.type === "update") return { type: "update", ...base };
  if (event.source !== "ai" && event.source !== "basic") return null;
  return { type: "done", source: event.source, ...base };
}
