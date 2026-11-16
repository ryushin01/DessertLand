import { describe, expect, it } from "vitest";

import { parsePartialJson } from "./partial-json";

describe("parsePartialJson", () => {
  it("완성된 JSON을 그대로 읽습니다", () => {
    expect(parsePartialJson('{"a":1,"b":["x"]}')).toEqual({ a: 1, b: ["x"] });
  });

  it("쓰이는 중인 값 문자열을 닫아 읽습니다", () => {
    expect(parsePartialJson('{"intro":"상큼한')).toEqual({ intro: "상큼한" });
    expect(parsePartialJson('{"picks":[{"slug":"baklava","reason":"견과')).toEqual({
      picks: [{ slug: "baklava", reason: "견과" }],
    });
  });

  it("끝나지 않은 키는 버립니다", () => {
    expect(parsePartialJson('{"intro":"안녕","pi')).toEqual({ intro: "안녕" });
    expect(parsePartialJson('{"intro":"안녕","picks"')).toEqual({ intro: "안녕" });
    expect(parsePartialJson('{"intro":"안녕","picks":')).toEqual({ intro: "안녕" });
  });

  it("이스케이프 중간에서도 깨지지 않습니다", () => {
    expect(parsePartialJson('{"intro":"줄\\')).toEqual({ intro: "줄" });
    expect(parsePartialJson('{"intro":"가\\u12')).toEqual({ intro: "가" });
    expect(parsePartialJson('{"intro":"따옴\\"표"}')).toEqual({ intro: '따옴"표' });
  });

  it("빈 입력과 읽을 수 없는 입력은 안전하게 처리합니다", () => {
    expect(parsePartialJson("")).toBeNull();
    expect(parsePartialJson("{")).toEqual({});
    expect(parsePartialJson("not json")).toBeNull();
  });

  it("공백과 줄바꿈이 섞여도 키와 값을 구분합니다", () => {
    expect(parsePartialJson('{\n  "intro" : "안녕",\n  "picks" : [ { "slug" : "bak')).toEqual({
      intro: "안녕",
      picks: [{ slug: "bak" }],
    });
  });

  it("스트림의 모든 조각을 읽고, 끝까지 오면 완성된 값과 같습니다", () => {
    const full = JSON.stringify({
      intro: "오늘은 \"달콤한\" 디저트를 골랐어요.",
      excludedAllergens: ["nuts"],
      picks: [
        { slug: "baklava", reason: "견과 대신 꿀이 \\ 가득" },
        { slug: "tiramisu", reason: "커피 향" },
      ],
    });
    for (let end = 0; end <= full.length; end += 1) {
      const value = parsePartialJson(full.slice(0, end));
      expect(value === null || typeof value === "object").toBe(true);
    }
    expect(parsePartialJson(full)).toEqual(JSON.parse(full));
  });

  it("긴 응답을 조각마다 읽어도 빠르게 끝납니다", () => {
    const picks = Array.from({ length: 400 }, (_, index) => ({
      slug: `dessert-${index}`,
      reason: "부드럽고 달콤한 맛이 오래 남는 디저트입니다.".repeat(2),
    }));
    const full = JSON.stringify({ intro: "추천", picks });
    const started = performance.now();
    for (let end = 0; end <= full.length; end += 100) parsePartialJson(full.slice(0, end));
    // 3만여 자를 100자 조각마다 다시 읽어도 로컬에서 0.1초 남짓입니다. 크게 느려지면 실패합니다.
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

