import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { buildSessionParams, isSessionRequest } from "./build-session";
import { getStripeTestClient } from "./stripe.server";

export async function POST(request: NextRequest) {
  const stripe = getStripeTestClient();
  if (!stripe) return NextResponse.json({ status: "disabled" }, { status: 503 });

  const body: unknown = await request.json().catch(() => null);
  if (!isSessionRequest(body)) return NextResponse.json({ status: "invalid" }, { status: 400 });

  const tProducts = await getTranslations({ locale: body.locale, namespace: "products" });
  const tCart = await getTranslations({ locale: body.locale, namespace: "cart" });
  const params = buildSessionParams({
    request: body,
    origin: request.nextUrl.origin,
    productName: (slug) => tProducts(`${slug}.name` as Parameters<typeof tProducts>[0]) as string,
    shippingName: tCart("shipping"),
  });
  if (!params) return NextResponse.json({ status: "amount_mismatch" }, { status: 409 });

  try {
    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ status: "created", url: session.url });
  } catch (error) {
    console.error("Stripe 결제 세션 생성 실패", error instanceof Error ? error.message : error);
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
