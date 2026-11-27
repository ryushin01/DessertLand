"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadHttp } from "@/shared/api";

import { parseRecommendEvent } from "../model/parse-event";
import type { Pick, RecommendRequest } from "../model/types";

export type RecommendStatus = "idle" | "loading" | "done" | "error" | "limited";

type State = {
  status: RecommendStatus;
  intro: string;
  picks: Pick[];
  source: "ai" | "basic" | null;
};

const INITIAL: State = { status: "idle", intro: "", picks: [], source: null };

export function useRecommendation() {
  const [state, setState] = useState<State>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const recommend = useCallback(async (data: RecommendRequest) => {
    // 새로 요청하면 이전 응답은 버립니다.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ ...INITIAL, status: "loading" });
    try {
      const { http, keepResponse } = await loadHttp();
      // 429(요청 한도)를 따로 알리려고 상태 코드와 관계없이 응답을 받고, 본문 스트림은 직접 읽습니다.
      const response = await http
        .url("/api/recommend")
        .signal(controller)
        .json(data)
        .post()
        .res()
        .catch(keepResponse);
      if (response.status === 429) {
        setState({ ...INITIAL, status: "limited" });
        return;
      }
      if (!response.ok || !response.body) throw new Error(`응답 ${response.status}`);

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finished = false;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line) continue;
            const event = parseRecommendEvent(line);
            if (!event || event.type === "error") throw new Error("추천 실패");
            if (event.type === "update") {
              setState({ status: "loading", intro: event.intro, picks: event.picks, source: null });
            } else {
              finished = true;
              setState({
                status: "done",
                intro: event.intro,
                picks: event.picks,
                source: event.source,
              });
            }
          }
        }
      } finally {
        // 중간에 빠져나와도(오류 이벤트, 형식 오류) 스트림을 닫아 연결과 버퍼를 놓아 줍니다.
        void reader.cancel().catch(() => undefined);
      }
      if (!finished) throw new Error("응답이 끊겼습니다");
    } catch {
      if (controller.signal.aborted) return;
      setState({ ...INITIAL, status: "error" });
    }
  }, []);

  return { ...state, recommend };
}
