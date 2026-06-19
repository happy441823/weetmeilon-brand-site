import { navItems } from "@/lib/navigation";
import { readPublicCmsRows } from "./public-content";

export type PublicChromeLink = {
  label: string;
  href: string;
  showDesktop?: boolean;
  showMobile?: boolean;
};

export const fallbackFooterLinks: PublicChromeLink[] = [
  { label: "隐私政策", href: "/privacy-policy" },
  { label: "用户协议", href: "/terms" },
  { label: "免责声明", href: "/disclaimer" },
  { label: "联系我们", href: "/contact" }
];

function isSafeSitePath(value: unknown) {
  const href = String(value || "").trim();
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/admin") && !href.startsWith("/api");
}

function rowToChromeLink(row: Record<string, unknown>): PublicChromeLink | null {
  const label = String(row.label || "").trim();
  const href = String(row.href || "").trim();
  if (!label || !isSafeSitePath(href)) return null;
  return {
    label,
    href,
    showDesktop: row.show_desktop !== 0,
    showMobile: row.show_mobile !== 0
  };
}

export async function getPublicHeaderNavItems(): Promise<PublicChromeLink[]> {
  const result = await readPublicCmsRows<Record<string, unknown>>("navigation_items");
  const fallback = navItems.map((item) => ({ ...item, showDesktop: true, showMobile: true }));
  if (result.source !== "d1") {
    return fallback;
  }
  const d1Links = result.rows.map(rowToChromeLink).filter((item): item is PublicChromeLink => Boolean(item));
  const hrefs = new Set(d1Links.map((item) => item.href));
  return [...d1Links, ...fallback.filter((item) => !hrefs.has(item.href))];
}

export async function getPublicFooterLinks(): Promise<PublicChromeLink[]> {
  const [groups, items] = await Promise.all([
    readPublicCmsRows<Record<string, unknown>>("footer_groups"),
    readPublicCmsRows<Record<string, unknown>>("footer_items")
  ]);
  if (groups.source !== "d1" || items.source !== "d1") {
    return fallbackFooterLinks;
  }

  const visibleGroupIds = new Set(groups.rows.map((row) => String(row.id || "")).filter(Boolean));
  return items.rows
    .filter((row) => !row.group_id || visibleGroupIds.has(String(row.group_id)))
    .map(rowToChromeLink)
    .filter((item): item is PublicChromeLink => Boolean(item));
}
