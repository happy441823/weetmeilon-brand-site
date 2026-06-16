"use client";

import { useEffect } from "react";
import type { StoreChannel } from "@/config/storeLinks";
import { storeLinks } from "@/config/storeLinks";
import { trackEvent } from "@/lib/analytics";

type StoreButtonProps = {
  channel: StoreChannel;
  label?: string;
  source: string;
  productSlug?: string;
  className?: string;
  variant?: "primary" | "secondary";
};

const channelMeta: Record<StoreChannel, { defaultLabel: string; eventName: "click_tmall_button" | "click_jd_button" }> = {
  tmall: {
    defaultLabel: "前往天猫旗舰店",
    eventName: "click_tmall_button"
  },
  jd: {
    defaultLabel: "前往京东旗舰店",
    eventName: "click_jd_button"
  }
};

function isValidStoreHref(href: string) {
  if (href.includes("TMALL_STORE_URL") || href.includes("JD_STORE_URL")) {
    return false;
  }

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function StoreButton({ channel, label, source, productSlug, className = "", variant = "primary" }: StoreButtonProps) {
  const meta = channelMeta[channel];
  const href = storeLinks[channel];
  const isValidHref = isValidStoreHref(href);
  const variantClass =
    variant === "secondary"
      ? "border border-mint-300/35 bg-plum-900/80 text-mint-300 shadow-none hover:border-mint-300/70 hover:bg-plum-800"
      : "bg-mint-gradient text-plum-950 shadow-glow hover:shadow-[0_0_56px_rgba(83,240,208,0.28)]";
  const commonClass = `focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-black transition ${variantClass} ${className}`;

  useEffect(() => {
    if (!isValidHref && process.env.NODE_ENV !== "production") {
      console.warn(`[store-links] ${channel} store URL is not configured correctly: ${href}`);
    }
  }, [channel, href, isValidHref]);

  if (!isValidHref) {
    return (
      <span className={`${commonClass} pointer-events-none cursor-not-allowed opacity-55`} role="link" aria-disabled="true">
        {label || meta.defaultLabel}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={`${commonClass} hover:-translate-y-0.5`}
      onClick={() => trackEvent(meta.eventName, { source, product_slug: productSlug, target: href, channel })}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
    >
      {label || meta.defaultLabel}
      <span aria-hidden>↗</span>
    </a>
  );
}

type StoreButtonsProps = {
  source: string;
  productSlug?: string;
  tmallLabel?: string;
  jdLabel?: string;
  className?: string;
  buttonClassName?: string;
};

export function StoreButtons({
  source,
  productSlug,
  tmallLabel = "前往天猫旗舰店",
  jdLabel = "前往京东旗舰店",
  className = "",
  buttonClassName = ""
}: StoreButtonsProps) {
  return (
    <div className={`flex flex-col gap-3 md:flex-row ${className}`}>
      <StoreButton channel="tmall" source={source} productSlug={productSlug} label={tmallLabel} className={buttonClassName} />
      <StoreButton channel="jd" source={source} productSlug={productSlug} label={jdLabel} variant="secondary" className={buttonClassName} />
    </div>
  );
}
