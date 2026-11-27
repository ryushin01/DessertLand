/** MSW 목업이 함께 쓰는 예시 값. 테스트도 이 값으로 결과를 확인합니다. */
export const MOCK_RECOMMENDATION = {
  intro: "커피와 어울리는 부드러운 디저트를 골랐어요.",
  excludedAllergens: [] as string[],
  picks: [
    { slug: "tiramisu", reason: "커피에 적신 비스킷과 마스카르포네가 잘 어울려요." },
    { slug: "pastel-de-nata", reason: "바삭한 껍질과 달걀 크림이 커피와 좋아요." },
    { slug: "basque-cheesecake", reason: "진하지만 달지 않은 치즈 맛이에요." },
  ],
};

/** Stripe 테스트 세션 ID 모양(cs_test_ + 영문·숫자)에 맞는 목업 ID. */
export const mockSessionId = (seed: number) => `cs_test_msw${seed.toString(36).padStart(10, "0")}`;
