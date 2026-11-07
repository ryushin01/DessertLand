"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import { addLine, cartAnnouncementAtom, cartLinesAtom, cartOpenAtom } from "@/entities/cart";
import { Button, Icon } from "@/shared/ui";

type AddToCartButtonProps = {
  slug: string;
  quantity?: number;
  /** 화면에 보이는 문구. */
  children: React.ReactNode;
  /** 문맥이 부족한 짧은 문구일 때의 접근 가능한 이름. 화면 문구를 포함해야 합니다. */
  accessibleName?: string;
  size?: "md" | "sm";
  tone?: "solid" | "outline";
};

export function AddToCartButton({
  slug,
  quantity = 1,
  children,
  accessibleName,
  size,
  tone,
}: AddToCartButtonProps) {
  const tCart = useTranslations("cart");
  const tProducts = useTranslations("products");
  const setLines = useSetAtom(cartLinesAtom);
  const setOpen = useSetAtom(cartOpenAtom);
  const announce = useSetAtom(cartAnnouncementAtom);

  return (
    <Button
      size={size}
      tone={tone}
      aria-label={accessibleName}
      data-magnetic
      onClick={() => {
        setLines((lines) => addLine(lines, slug, quantity));
        announce(
          tCart("added", {
            name: tProducts(`${slug}.name` as Parameters<typeof tProducts>[0]) as string,
          }),
        );
        setOpen(true);
      }}
    >
      <Icon name="shopping-bag" />
      {children}
    </Button>
  );
}
