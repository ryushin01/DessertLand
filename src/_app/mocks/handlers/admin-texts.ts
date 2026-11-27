import { HttpResponse, http } from "msw";

// 어드민 데모 워커(browser.ts)에는 싣지 않습니다. 10개 언어 메시지를 읽으므로 워커 번들이 커지지 않게 파일을 나눴습니다.
/** 테스트·Storybook용: 어드민 상품 편집의 언어별 원문(실제 서버는 /api/admin/product-texts가 메시지 파일에서 읽음). */
export const adminTextHandlers = [
  http.get("/api/admin/product-texts", async ({ request }) => {
    const locale = new URL(request.url).searchParams.get("locale") ?? "ko";
    const messages = await loadMessages(locale);
    return messages
      ? HttpResponse.json({ status: "ok", products: messages.products })
      : HttpResponse.json({ status: "invalid" }, { status: 400 });
  }),
];

async function loadMessages(locale: string) {
  switch (locale) {
    case "ko":
      return (await import("@/shared/i18n/messages/ko.json")).default;
    case "en":
      return (await import("@/shared/i18n/messages/en.json")).default;
    case "ja":
      return (await import("@/shared/i18n/messages/ja.json")).default;
    case "zh":
      return (await import("@/shared/i18n/messages/zh.json")).default;
    case "fr":
      return (await import("@/shared/i18n/messages/fr.json")).default;
    case "it":
      return (await import("@/shared/i18n/messages/it.json")).default;
    case "es":
      return (await import("@/shared/i18n/messages/es.json")).default;
    case "de":
      return (await import("@/shared/i18n/messages/de.json")).default;
    case "pt":
      return (await import("@/shared/i18n/messages/pt.json")).default;
    case "tr":
      return (await import("@/shared/i18n/messages/tr.json")).default;
    default:
      return null;
  }
}
