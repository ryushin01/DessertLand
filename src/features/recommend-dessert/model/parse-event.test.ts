import { describe, expect, it } from "vitest";

import { parseRecommendEvent } from "./parse-event";

describe("parseRecommendEvent", () => {
  it("중간·마지막·오류 이벤트를 읽습니다", () => {
    expect(
      parseRecommendEvent('{"type":"update","intro":"a","picks":[{"slug":"x","reason":"r"}]}'),
    ).toEqual({
      type: "update",
      intro: "a",
      picks: [{ slug: "x", reason: "r" }],
    });
    expect(
      parseRecommendEvent('{"type":"done","source":"ai","intro":"a","picks":[]}'),
    ).toMatchObject({
      type: "done",
      source: "ai",
    });
    expect(parseRecommendEvent('{"type":"error"}')).toEqual({ type: "error" });
  });

  it("추천은 최대 개수까지만 받습니다", () => {
    const picks = Array.from({ length: 5 }, (_, i) => ({ slug: `s${i}`, reason: "" }));
    expect(parseRecommendEvent(JSON.stringify({ type: "update", intro: "", picks }))?.type).toBe(
      "update",
    );
    const event = parseRecommendEvent(JSON.stringify({ type: "update", intro: "", picks }));
    expect(event && "picks" in event ? event.picks : []).toHaveLength(3);
  });

  it("JSON이 아니거나 모양이 다르면 null", () => {
    expect(parseRecommendEvent("{oops")).toBeNull();
    expect(parseRecommendEvent('{"type":"update","intro":"a","picks":[{"slug":1}]}')).toBeNull();
    expect(parseRecommendEvent('{"type":"done","intro":"a","picks":[]}')).toBeNull();
    expect(parseRecommendEvent('{"type":"other"}')).toBeNull();
    expect(parseRecommendEvent("null")).toBeNull();
  });
});
