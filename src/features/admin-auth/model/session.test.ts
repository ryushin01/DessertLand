import { describe, expect, it } from "vitest";

import {
  DEMO_SESSION,
  SESSION_TTL_MS,
  createSessionToken,
  isPasswordCorrect,
  isValidSession,
} from "./session";

const config = { demo: false, password: "correct horse battery" };

describe("어드민 세션", () => {
  it("비밀번호로 서명한 세션은 만료 전까지만 유효합니다", async () => {
    const token = await createSessionToken(config.password, 1000);
    expect(await isValidSession(token, config, 2000)).toBe(true);
    expect(await isValidSession(token, config, 1000 + SESSION_TTL_MS + 1)).toBe(false);
  });

  it("서명을 바꾸거나 다른 비밀번호로 만든 세션은 받지 않습니다", async () => {
    const token = await createSessionToken(config.password, 1000);
    expect(await isValidSession(`${token}x`, config, 2000)).toBe(false);
    expect(await isValidSession(token, { ...config, password: "another password!!" }, 2000)).toBe(
      false,
    );
    expect(await isValidSession(token, { demo: false, password: undefined }, 2000)).toBe(false);
  });

  it("데모 세션은 데모 빌드에서만 받습니다", async () => {
    expect(await isValidSession(DEMO_SESSION, { demo: true, password: undefined }, 0)).toBe(true);
    expect(await isValidSession(DEMO_SESSION, config, 0)).toBe(false);
  });

  it("비밀번호를 비교합니다", async () => {
    expect(await isPasswordCorrect("correct horse battery", config.password)).toBe(true);
    expect(await isPasswordCorrect("wrong", config.password)).toBe(false);
  });
});
