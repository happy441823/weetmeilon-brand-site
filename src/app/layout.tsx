import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicHeaderNavItems } from "@/lib/cms/public-site-chrome";
import { BRAND, PRIMARY_SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(PRIMARY_SITE_URL),
  title: {
    default: `${BRAND.name}｜官方品牌站`,
    template: `%s｜${BRAND.name}`
  },
  description:
    "蜜女郎官方品牌站，介绍高质感硅胶产品、原生肌凝硅材质体验、隐私发货说明与清洁保养指南，可前往天猫或京东官方旗舰店购买。",
  keywords: [
    "蜜女郎",
    "天猫蜜女郎旗舰店",
    "京东蜜女郎旗舰店",
    "蜜女郎官方",
    "京东旗舰店",
    "原生肌凝硅",
    "硅胶产品",
    "成人用品隐私发货",
    "官方旗舰店"
  ],
  openGraph: {
    title: `${BRAND.name}｜官方品牌站`,
    description: "真实质感，从材质开始。官方旗舰店、隐私发货、品质硅胶产品。",
    url: PRIMARY_SITE_URL,
    siteName: BRAND.name,
    locale: "zh_CN",
    type: "website"
  },
  alternates: {
    canonical: PRIMARY_SITE_URL
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#13001f"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerItems = await getPublicHeaderNavItems();

  return (
    <html lang="zh-CN">
      <body>
        <AnalyticsProvider />
        <AgeGate />
        <SiteHeader items={headerItems} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
