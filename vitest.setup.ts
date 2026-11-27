import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { resetStripeSessions } from "@/_app/mocks/handlers";
import { server } from "@/_app/mocks/node";

// 모든 테스트의 네트워크는 MSW(src/_app/mocks)가 받습니다. 테스트마다 server.use로 응답을 바꾸고, 끝나면 되돌립니다.
beforeAll(() => server.listen({ onUnhandledFrame: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetStripeSessions();
});
afterAll(() => server.close());

// jsdom에는 matchMedia가 없어 GSAP과 모션 훅이 불러올 때 실패합니다.
vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
);
