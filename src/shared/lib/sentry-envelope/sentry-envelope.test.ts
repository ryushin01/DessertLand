import { describe, expect, it } from "vitest";

import { parseDsn, parseStack } from ".";

describe("parseDsn", () => {
  it("공개 키, 호스트, 프로젝트 ID와 보낼 주소를 만듭니다", () => {
    expect(parseDsn("https://abc123@o1.ingest.us.sentry.io/4507")).toEqual({
      publicKey: "abc123",
      host: "o1.ingest.us.sentry.io",
      projectId: "4507",
      envelopeUrl:
        "https://o1.ingest.us.sentry.io/api/4507/envelope/?sentry_version=7&sentry_key=abc123",
    });
  });

  it.each([undefined, "", "not a url", "http://k@h.io/1", "https://h.io/1", "https://k@h.io/abc"])(
    "형식이 다르면 null: %s",
    (dsn) => {
      expect(parseDsn(dsn)).toBeNull();
    },
  );
});

describe("parseStack", () => {
  it("V8 스택을 오래된 호출부터의 프레임으로 바꿉니다", () => {
    const stack = [
      "Error: boom",
      "    at render (/var/task/.next/server/app/page.js:10:5)",
      "    at /var/task/node_modules/react/index.js:3:1",
    ].join("\n");
    expect(parseStack(stack)).toEqual([
      {
        function: "?",
        filename: "/var/task/node_modules/react/index.js",
        lineno: 3,
        colno: 1,
        in_app: false,
      },
      {
        function: "render",
        filename: "/var/task/.next/server/app/page.js",
        lineno: 10,
        colno: 5,
        in_app: true,
      },
    ]);
    expect(parseStack(undefined)).toEqual([]);
  });
});
