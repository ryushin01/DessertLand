import type { ReactNode } from "react";

import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe } from "@/shared/ui";

type BuyNowLinkProps = { slug: string; quantity: number; children: ReactNode };

/** 장바구니를 거치지 않고 이 상품만 주문하는 화면으로 이동합니다. */
export function BuyNowLink({ slug, quantity, children }: BuyNowLinkProps) {
  return (
    <Link
      href={{ pathname: "/checkout", query: { buy: slug, qty: quantity } }}
      className={buttonRecipe({ tone: "outline" })}
      data-magnetic
    >
      {children}
      <Icon name="arrow-right" />
    </Link>
  );
}
