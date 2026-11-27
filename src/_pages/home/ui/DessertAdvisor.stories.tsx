import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, http } from "msw";

import { recommendChunks } from "@/_app/mocks/handlers";
import { chunkedStream } from "@/_app/mocks/stream";

import { DessertAdvisor } from "./DessertAdvisor";

const meta: Meta<typeof DessertAdvisor> = {
  title: "pages/Home/DessertAdvisor",
  component: DessertAdvisor,
};
export default meta;

/** 추천받기를 누르면 MSW가 AI 추천을 조각 스트림으로 흘려보냅니다(공통 목업). */
export const Default: StoryObj<typeof DessertAdvisor> = {};

/** 기본 추천(AI 미사용) 응답 */
export const Basic: StoryObj<typeof DessertAdvisor> = {
  parameters: {
    msw: {
      handlers: [
        http.post(
          "/api/recommend",
          () =>
            new HttpResponse(
              chunkedStream(
                recommendChunks([
                  {
                    type: "done",
                    source: "basic",
                    intro: "선택한 취향에 맞춰 골랐습니다.",
                    picks: [{ slug: "macaron", reason: "가벼워요." }],
                  },
                ]),
              ),
            ),
        ),
      ],
    },
  },
};

/** 요청 한도(429) */
export const Limited: StoryObj<typeof DessertAdvisor> = {
  parameters: {
    msw: { handlers: [http.post("/api/recommend", () => new HttpResponse(null, { status: 429 }))] },
  },
};
