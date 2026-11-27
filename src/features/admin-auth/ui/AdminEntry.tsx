"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Eyebrow, SlashMark, TextButton, TextField } from "@/shared/ui/admin-kit";

import { safeNext, signIn, type SignInResult } from "../api/client";
import styles from "./AdminEntry.module.css";

type AdminEntryProps = {
  /** 공개 데모 빌드인지(관리자로 둘러보기 버튼) */
  demo: boolean;
  /** ADMIN_PASSWORD가 설정됐는지(비밀번호 들어가기) */
  passwordEnabled: boolean;
};

const MESSAGES: Record<Exclude<SignInResult, "ok">, string> = {
  wrong: "비밀번호가 맞지 않습니다. 다시 입력해 주세요.",
  disabled: "이 방법으로는 들어갈 수 없습니다. 관리자 설정을 확인해 주세요.",
  limited: "시도가 너무 많습니다. 1분 뒤 다시 시도해 주세요.",
  error: "서버에 닿지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
};

/** 어드민 들어가기: 공개 데모는 "관리자로 둘러보기", 실제 운영은 관리자 비밀번호. */
export function AdminEntry({ demo, passwordEnabled }: AdminEntryProps) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const passwordRef = useRef<HTMLInputElement>(null);

  const finish = (result: SignInResult) => {
    if (result === "ok") {
      setMessage("들어갔습니다. 대시보드로 이동합니다.");
      router.replace(next);
      router.refresh();
      return;
    }
    setPending(false);
    if (result === "wrong") {
      setPasswordError(MESSAGES.wrong);
      passwordRef.current?.focus();
    } else {
      setMessage(MESSAGES[result]);
    }
  };

  const enterDemo = async () => {
    setPending(true);
    setMessage(null);
    finish(await signIn({ mode: "demo" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = passwordRef.current?.value ?? "";
    if (!password) {
      setPasswordError("비밀번호를 입력해 주세요.");
      passwordRef.current?.focus();
      return;
    }
    setPasswordError(undefined);
    setPending(true);
    setMessage(null);
    finish(await signIn({ mode: "password", password }));
  };

  return (
    <>
      <a href="#admin-main" className={styles.skip}>
        본문 바로가기
      </a>
      <main id="admin-main" tabIndex={-1} className={styles.root}>
        <header>
          <Eyebrow>Dessert Land · Back office</Eyebrow>
        </header>
        <h1 className={styles.title}>
          Dessert Land <SlashMark />
        </h1>
        <p className={styles.lede}>
          전 세계 디저트 175종의 상품·주문·맛과 알레르기 성분·AI 추천 기록을 관리하는 화면입니다.
        </p>
        <div className={styles.panel}>
          {demo ? (
            <>
              <button
                type="button"
                className={styles.demoButton}
                onClick={enterDemo}
                disabled={pending}
              >
                관리자로 둘러보기
              </button>
              <ul className={styles.notes}>
                <li>
                  공개 데모입니다. 시드 데이터(주문 72건, 추천 기록)로 모든 화면을 볼 수 있습니다.
                </li>
                <li>
                  고친 상품은 이 브라우저에만 저장되어 같은 브라우저의 쇼핑몰에 바로 반영됩니다.
                </li>
                <li>환불은 실제 결제 없이 내장 테스트 결제 기록으로 처리합니다.</li>
                <li>위쪽 &lsquo;데모 데이터 초기화&rsquo;를 누르면 처음 상태로 돌아갑니다.</li>
              </ul>
            </>
          ) : null}
          {passwordEnabled ? (
            <form className={styles.form} onSubmit={submit} noValidate>
              <TextField
                ref={passwordRef}
                label="관리자 비밀번호"
                type="password"
                name="password"
                autoComplete="current-password"
                error={passwordError}
                onChange={() => setPasswordError(undefined)}
              />
              <TextButton type="submit" className={styles.submit} disabled={pending}>
                들어가기
              </TextButton>
            </form>
          ) : null}
          {!demo && !passwordEnabled ? (
            <p>
              관리자 인증이 설정되지 않아 들어갈 수 없습니다. 운영 환경 변수{" "}
              <code>ADMIN_PASSWORD</code>(12자 이상)를 설정해 주세요.
            </p>
          ) : null}
          <p
            role="status"
            className={`${styles.status} ${message && message !== "들어갔습니다. 대시보드로 이동합니다." ? styles.statusError : ""}`}
          >
            {message}
          </p>
        </div>
      </main>
    </>
  );
}
