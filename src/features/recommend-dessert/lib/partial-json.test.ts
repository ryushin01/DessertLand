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
});
