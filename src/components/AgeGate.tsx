"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "minvlang_age_confirmed_v1";
const COOKIE_KEY = "minvlang_age_confirmed";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isStoredConfirmationValid(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value) as { confirmedAt?: number };
    return typeof parsed.confirmedAt === "number" && Date.now() - parsed.confirmedAt < MAX_AGE_MS;
  } catch {
    return value === "yes";
  }
}

export function AgeGate() {
  const [visible, setVisible] = useState(true);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const declineButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hasCookie = document.cookie.split("; ").some((item) => item === `${COOKIE_KEY}=yes`);
    setVisible(!hasCookie && !isStoredConfirmationValid(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    primaryButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div data-nosnippet className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 px-4 backdrop-blur-xl">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-description"
        className="w-full max-w-md rounded-[28px] border border-white/14 bg-plum-950/95 p-6 shadow-purple"
        onKeyDown={(event) => {
          if (event.key !== "Tab") {
            return;
          }

          const first = primaryButtonRef.current;
          const last = declineButtonRef.current;
          if (!first || !last) {
            return;
          }

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="mb-5 inline-flex rounded-full border border-mint-300/30 bg-mint-300/10 px-3 py-1 text-xs font-semibold text-mint-300">
          18+ 年龄确认
        </div>
        <h2 id="age-gate-title" className="text-2xl font-black tracking-tight text-white">本网站仅面向成年人访问</h2>
        <p id="age-gate-description" className="mt-3 text-sm leading-7 text-aura/78">
          蜜女郎官方品牌站展示成人私密生活用品相关信息。进入前，请确认你已年满 18 周岁，并理解本站内容仅用于品牌介绍、材质说明、使用清洁指南与官方购买渠道跳转。
        </p>
        <div className="mt-6 grid gap-3">
          <button
            ref={primaryButtonRef}
            className="focus-ring rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:scale-[1.01]"
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ confirmedAt: Date.now() }));
              document.cookie = `${COOKIE_KEY}=yes; Max-Age=${MAX_AGE_MS / 1000}; Path=/; SameSite=Lax`;
              setVisible(false);
            }}
          >
            我已年满 18 周岁，进入官网
          </button>
          <button
            ref={declineButtonRef}
            className="focus-ring rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-aura/75 transition hover:bg-white/8"
            onClick={() => {
              window.location.href = "/not-for-minors";
            }}
          >
            暂不访问
          </button>
        </div>
        <p className="mt-4 text-xs leading-6 text-aura/50">未成年人请立即离开。本站不提供医疗建议，不承诺任何医疗、健康、情感或能力效果。</p>
      </div>
    </div>
  );
}
