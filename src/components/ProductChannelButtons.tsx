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

export function ProductChannelButtons({
  product,
  source,
  className = "",
  buttonClassName = ""
}: ProductChannelButtonsProps) {
  const channels = channelOrder
    .map((channel) => ({ channel, link: product.channelLinks[channel] }))
    .filter(({ link }) => link.enabled && link.verified && isValidProductHref(link.url));

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
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${variantMap[channel]} ${buttonClassName}`}
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
          {link.label}
          <span aria-hidden>-&gt;</span>
        </a>
      ))}
    </div>
  );
}
