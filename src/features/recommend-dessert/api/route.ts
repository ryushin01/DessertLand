import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import type { Allergen, Product } from "@/entities/product";
import { LOCALES } from "@/shared/i18n/index.server";
import { clientKey, createRateLimiter } from "@/shared/lib/rate-limit";

import { isRecommendRequest, recommendLocally } from "../lib/recommend";
import type { RecommendEvent, RecommendRequest, Recommendation } from "../model/types";
import { isClaudeEnabled, streamRecommendation } from "./claude.server";
import { buildSystemPrompt } from "./prompt";

// 공개 데모라 호출 비용을 제한합니다. 사람별 제한을 넘으면 429, 전체 제한을 넘으면 기본 추천으로 돌립니다.
const perClient = createRateLimiter(8, 60_000);
const perDay = createRateLimiter(300, 24 * 60 * 60_000);

async function loadWords(locale: string) {
  const [tProducts, tCategories, tAllergens, tAdvisor] = await Promise.all([
    getTranslations({ locale, namespace: "products" }),
    getTranslations({ locale, namespace: "categories" }),
    getTranslations({ locale, namespace: "allergens" }),
    getTranslations({ locale, namespace: "advisor" }),
  ]);
  return {
    basicIntro: tAdvisor("basicIntro"),
    productName: (slug: string) => tProducts(`${slug}.name` as never) as string,
    productDescription: (slug: string) => tProducts(`${slug}.description` as never) as string,
    categoryName: (product: Product) => tCategories(`${product.category}.name`),
    allergenName: (allergen: Allergen) => tAllergens(allergen),
  };
}

async function basicRecommendation(request: RecommendRequest): Promise<Recommendation> {
  const words = await loadWords(request.locale);
  return { intro: words.basicIntro, picks: recommendLocally(request, words) };
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecommendRequest(body) || !LOCALES.includes(body.locale as never)) {
    return NextResponse.json({ type: "error" }, { status: 400 });
  }
  if (!perClient.take(clientKey(request.headers))) {
    return NextResponse.json({ type: "error" }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const body_ = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 사용자가 연결을 끊으면 스트림이 먼저 닫힐 수 있습니다.
      const send = (event: RecommendEvent) => {
        if (request.signal.aborted) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        let result: Recommendation | null = null;
        if (isClaudeEnabled() && perDay.take("global")) {
          try {
            const descriptions = await getTranslations({ locale: "en", namespace: "products" });
            result = await streamRecommendation({
              request: body,
              system: buildSystemPrompt(
                (slug) => descriptions(`${slug}.description` as never) as string,
              ),
              signal: request.signal,
              onUpdate: (next) => send({ type: "update", ...next }),
            });
          } catch (error) {
            if (request.signal.aborted) return;
            console.error("추천 호출 실패", error instanceof Error ? error.name : "unknown");
          }
        }
        if (result) send({ type: "done", source: "ai", ...result });
        else send({ type: "done", source: "basic", ...(await basicRecommendation(body)) });
      } catch {
        try {
          send({ type: "error" });
        } catch {
          // 이미 닫힌 스트림입니다.
        }
      } finally {
        try {
          controller.close();
        } catch {
          // 이미 닫혔으면 할 일이 없습니다.
        }
      }
    },
  });

  return new Response(body_, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
