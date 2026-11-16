"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { Link } from "@/shared/i18n";
import { Button, buttonRecipe } from "@/shared/ui";

import { reportError } from "../monitoring";

// 404 화면과 같은 배치를 씁니다.
const page = css({
  minHeight: "100svh",
  display: "grid",
  placeContent: "center",
  justifyItems: "center",
  gap: "24px",
  padding: "16px",
  textAlign: "center",
});
const title = css({ fontFamily: "display", fontSize: "clamp(2.6rem, 8vw, 7rem)", lineHeight: "1" });
const actions = css({ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" });

type RouteErrorProps = { error: Error & { digest?: string }; reset: () => void };

/** 화면을 그리다 난 오류를 Sentry로 보내고, 다시 시도하거나 홈으로 돌아가게 합니다. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  const t = useTranslations("error");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    reportError(error);
    headingRef.current?.focus();
  }, [error]);

  return (
    <div className={page}>
      <h1 ref={headingRef} tabIndex={-1} className={title}>
        {t("title")}
      </h1>
      <div className={actions}>
        <Button onClick={reset}>{t("retry")}</Button>
        <Link href="/" className={buttonRecipe({ tone: "outline" })}>
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
