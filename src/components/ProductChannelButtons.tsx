"use client";

import type { PublicCatalogProduct, StoreChannel } from "@/types/catalog";
import { trackEvent } from "@/lib/analytics";

type ProductChannelButtonsProps = {
  product: Pick<PublicCatalogProduct, "id" | "slug" | "channelLinks">;
  source: string;
  className?: string;
  buttonClassName?: string;
};

const channelOrder: StoreChannel[] = ["tmall", "jd"];

const eventMap: Record<StoreChannel, "click_tmall_product" | "click_jd_product"> = {
  tmall: "click_tmall_product",
  jd: "click_jd_product"
};

const variantMap: Record<StoreChannel, string> = {
  tmall: "bg-mint-gradient text-plum-950 shadow-glow hover:shadow-[0_0_48px_rgba(83,240,208,0.24)]",
  jd: "border border-mint-300/35 bg-plum-900/80 text-mint-300 hover:border-mint-300/70 hover:bg-plum-800"
};

function isValidProductHref(url: string | null) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getChannelLabel(channel: StoreChannel, label: string, source: string) {
  if (source === "product_card") {
    return channel === "tmall" ? "天猫旗舰店" : "京东旗舰店";
  }

  return label || (channel === "tmall" ? "天猫官方旗舰店" : "京东官方旗舰店");
}

export function ProductChannelButtons({
  product,
  source,
  className = "",
  buttonClassName = ""
}: ProductChannelButtonsProps) {
  const channels = channelOrder
    .map((channel) => ({ channel, link: product.channelLinks[channel] }))
    .filter(({ link }) => link.enabled && isValidProductHref(link.url));

  if (channels.length === 0) {
    return null;
  }

  const gridClass = channels.length === 1 ? "grid-cols-1" : "sm:grid-cols-2";

  return (
    <div className={`grid gap-3 ${gridClass} ${className}`}>
      {channels.map(({ channel, link }) => (
        <a
          key={channel}
          href={link.url || "#"}
          className={`focus-ring inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-center text-sm font-black leading-tight transition hover:-translate-y-0.5 ${variantMap[channel]} ${buttonClassName}`}
          onClick={() =>
            trackEvent(eventMap[channel], {
              source,
              product_slug: product.slug,
              product_id: product.id,
              target: link.url,
              channel
            })
          }
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
        >
          <span className="min-w-0 break-keep">{getChannelLabel(channel, link.label, source)}</span>
          {source === "product_card" ? null : <span aria-hidden>-&gt;</span>}
        </a>
      ))}
    </div>
  );
}
