"use client";

import dynamic from "next/dynamic";

/**
 * 주문 받아 오기(와 공개 데모의 MSW 워커)는 브라우저에서만 돌립니다. msw/browser는 Node(서버 렌더링)에서 불러올 수 없어
 * 서버 렌더링 묶음에서 빼려고 ssr:false로 지연 로딩합니다.
 */
export const AdminDataSyncClient = dynamic(
  () => import("./AdminDataSync").then((module) => module.AdminDataSync),
  { ssr: false },
);
