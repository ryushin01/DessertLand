import type { ReactNode } from "react";

import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe } from "@/shared/ui";

type BuyNowLinkProps = {
  slug: string;
  quantity: number;
  /** 화면에 보이는 문구. */
  children: ReactNode;
  /** 목록처럼 문맥이 부족한 짧은 문구일 때의 접근 가능한 이름. 화면 문구로 시작해야 합니다. */
  accessibleName?: string;
  size?: "md" | "sm";
  tone?: "solid" | "outline";
};

/** 장바구니를 거치지 않고 이 상품만 주문하는 화면으로 이동합니다. */
export function BuyNowLink({
  slug,
  quantity,
  children,
  accessibleName,
  size,
  tone = "outline",
}: BuyNowLinkProps) {
  return (
    <Link
      href={{ pathname: "/checkout", query: { buy: slug, qty: quantity } }}
      className={buttonRecipe({ tone, size })}
      aria-label={accessibleName}
      data-magnetic
    >
      {children}
      <Icon name="arrow-right" />
    </Link>
  );
}
