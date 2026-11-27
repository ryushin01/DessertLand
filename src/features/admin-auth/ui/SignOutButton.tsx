"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TextButton } from "@/shared/ui/admin-kit";

import { signOut } from "../api/client";

/** 나가기: 세션 쿠키를 지우고 들어가기 화면으로 갑니다. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <TextButton
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      나가기
    </TextButton>
  );
}
