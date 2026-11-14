"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

import { motionPausedAtom } from "@/shared/lib/motion";
import { Icon } from "@/shared/ui";

const button = css({
  display: "grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  cursor: "pointer",
  transition: "background 0.2s",
  _hover: { background: "rgba(247, 236, 223, 0.16)" },
});

export function MotionToggle() {
  const t = useTranslations("nav");
  const [paused, setPaused] = useAtom(motionPausedAtom);
  const label = paused ? t("motionPlay") : t("motionPause");
  return (
    <button
      type="button"
      className={button}
      aria-label={label}
      title={label}
      onClick={() => setPaused(!paused)}
    >
      <Icon name={paused ? "play" : "pause"} />
    </button>
  );
}
