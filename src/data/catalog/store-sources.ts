import type { VerificationStatus } from "@/types/catalog";

export type StoreSource = {
  channel: "tmall" | "jd";
  storeName: string;
  storeUrl: string;
  verificationStatus: VerificationStatus;
  evidence: string[];
  lastCheckedAt: string;
  accessStatus: "verified_store" | "limited" | "needs_review";
  accessNote: string;
};

export const storeSources: StoreSource[] = [
  {
    channel: "tmall",
    storeName: "蜜女郎旗舰店",
    storeUrl: "https://minvlang.tmall.com/",
    verificationStatus: "needs_review",
    evidence: ["项目原有 NEXT_PUBLIC_TMALL_STORE_URL 指向该店铺入口", "公开访问出现登录/跳转链，未暴露稳定商品列表"],
    lastCheckedAt: "2026-06-13T11:23:01+08:00",
    accessStatus: "limited",
    accessNote: "未绕过登录或平台限制，商品详情链接暂不自动采集。"
  },
  {
    channel: "jd",
    storeName: "蜜女郎 SWEETMEILON官方旗舰店",
    storeUrl: "https://mall.jd.com/index-127854045.html?cid=0",
    verificationStatus: "verified",
    evidence: ["公开页面 title 与 meta 显示“蜜女郎 SWEETMEILON官方旗舰店 - 京东”", "项目原有 NEXT_PUBLIC_JD_STORE_URL 指向该官方店铺"],
    lastCheckedAt: "2026-06-13T11:23:00+08:00",
    accessStatus: "verified_store",
    accessNote: "公开静态 HTML 可访问，但商品列表由动态模块加载，未稳定返回可绑定商品详情 URL。"
  }
];
