"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StoreButton, StoreButtons } from "@/components/StoreButtons";
import { BRAND } from "@/lib/constants";
import type { PublicChromeLink } from "@/lib/cms/public-site-chrome";
import { navItems } from "@/lib/navigation";

export function SiteHeader({ items = navItems }: { items?: PublicChromeLink[] }) {
  const [open, setOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const channelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channelOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (channelMenuRef.current && !channelMenuRef.current.contains(event.target as Node)) {
        setChannelOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [channelOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/72 backdrop-blur-2xl">
      <div className="container-shell flex h-16 items-center justify-between gap-3 md:h-[76px]">
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-full md:gap-3" aria-label={`${BRAND.shortName}首页`}>
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-2xl bg-white shadow-glow md:h-11 md:w-11">
            <Image src="/images/logo.png" alt="蜜女郎 Logo" fill sizes="(min-width: 768px) 44px, 36px" className="object-contain p-1.5" priority />
          </span>
          <span className="min-w-0 space-y-0.5 leading-none">
            <span className="block truncate text-[19px] font-extrabold leading-none text-white md:text-[21px]">{BRAND.shortName}</span>
            <span className="block truncate text-[9px] font-black uppercase leading-none tracking-[0.16em] text-mint-300 md:text-[10px]">SWEETMEILON</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
          {items.filter((item) => item.showDesktop !== false).map((item) => (
            <Link key={item.href} href={item.href} className="focus-ring rounded-full px-3 py-2 text-sm font-semibold text-aura/72 transition hover:bg-white/8 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div ref={channelMenuRef} className="relative hidden items-center gap-3 md:flex">
          <button
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:-translate-y-0.5"
            onClick={() => setChannelOpen((value) => !value)}
            aria-expanded={channelOpen}
            aria-haspopup="menu"
          >
            官方渠道购买
            <span aria-hidden>{channelOpen ? "⌃" : "⌄"}</span>
          </button>
          {channelOpen ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[70] grid min-w-56 gap-2 rounded-3xl border border-white/12 bg-plum-950/96 p-3 shadow-purple backdrop-blur" role="menu">
              <StoreButton channel="tmall" source="header_dropdown" label="天猫旗舰店" className="w-full px-4 py-3" />
              <StoreButton channel="jd" source="header_dropdown" label="京东旗舰店" variant="secondary" className="w-full px-4 py-3" />
            </div>
          ) : null}
        </div>
        <button className="focus-ring rounded-full border border-white/12 p-2 text-white lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="打开导航">
          <span className="block min-w-10 text-xs font-black">{open ? "关闭" : "菜单"}</span>
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-plum-950/96 px-4 pb-5 pt-2 lg:hidden">
          <nav className="grid gap-1" aria-label="移动端导航">
            {items.filter((item) => item.showMobile !== false).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-aura/76 transition hover:bg-white/8 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-3">
            <p className="mb-3 px-1 text-xs font-black uppercase tracking-[0.2em] text-mint-300">官方渠道购买</p>
            <StoreButtons source="mobile_header" className="sm:flex-col" buttonClassName="w-full" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
