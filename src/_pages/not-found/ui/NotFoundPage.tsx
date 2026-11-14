import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

import { Link } from "@/shared/i18n";
import { buttonRecipe } from "@/shared/ui";

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

export default function NotFoundPage() {
  const t = useTranslations("notFound");
  return (
    <div className={page}>
      <h1 className={title}>{t("title")}</h1>
      <Link href="/" className={buttonRecipe()}>
        {t("back")}
      </Link>
    </div>
  );
}
