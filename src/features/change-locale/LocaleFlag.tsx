import { CN, DE, ES, FR, IT, JP, KR, PT, TR, US } from "country-flag-icons/react/1x1";
import { css, cx } from "styled-system/css";

import { LOCALE_COUNTRIES, type Locale } from "@/shared/i18n";

const FLAGS = { KR, US, JP, CN, FR, IT, ES, DE, PT, TR } as const;

/** 원형 테두리. 테두리와 국기 사이에 틈을 두어 국기가 안쪽 원으로 보이게 합니다. */
const ring = css({
  flex: "none",
  display: "grid",
  placeItems: "center",
  width: "1.75em",
  height: "1.75em",
  padding: "2px",
  borderRadius: "50%",
  border: "1.5px solid rgba(247, 236, 223, 0.45)",
});

const disc = css({
  width: "100%",
  height: "100%",
  borderRadius: "50%",
});

/** 나라 이름 옆에 붙이는 원형 국기. 옆에 이름이 있으므로 꾸밈으로 보고 보조기기에서 숨깁니다. */
export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  const Flag = FLAGS[LOCALE_COUNTRIES[locale]];
  return (
    <span aria-hidden="true" className={cx(ring, className)}>
      <Flag focusable="false" className={disc} />
    </span>
  );
}
