import { afterEach, describe, expect, it, vi } from "vitest";

/** 빌드 때 박히는 값이라, 환경 변수를 바꾼 뒤 모듈을 새로 읽어 확인합니다. */
async function demoModeWith(value: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_DEMO", value);
  const { DEMO_MODE } = await import("./demo");
  return DEMO_MODE;
}

describe("DEMO_MODE", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it(".env 없이 받아 실행해도(값 없음) 공개 데모가 켜져 어드민 화면을 볼 수 있습니다", async () => {
    expect(await demoModeWith(undefined)).toBe(true);
    expect(await demoModeWith("")).toBe(true);
  });

  it("1이면 켜지고, 0이면 꺼져 원래 동작(비밀번호 어드민)입니다", async () => {
    expect(await demoModeWith("1")).toBe(true);
    expect(await demoModeWith("0")).toBe(false);
  });
});
