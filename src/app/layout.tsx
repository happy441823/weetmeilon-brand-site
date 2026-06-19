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
    default: "蜜女郎 SWEETMEILON 官方品牌站｜材质、隐私购买与清洁指南",
    template: `%s｜${BRAND.name}`
  },
  description:
    "蜜女郎官方品牌站，提供产品系列、材质体验、隐私购买、清洁保养与官方旗舰店购买入口说明，帮助成年人购买前了解更清楚。",
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
    title: "蜜女郎 SWEETMEILON 官方品牌站｜材质、隐私购买与清洁指南",
    description: "蜜女郎官方品牌站，提供产品系列、材质体验、隐私购买、清洁保养与官方旗舰店购买入口说明。",
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
