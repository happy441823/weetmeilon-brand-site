export const BRAND = {
  name: "蜜女郎",
  shortName: "蜜女郎",
  platform: "官方品牌站",
  slogan: "真实质感，从材质开始"
} as const;

export const PRIMARY_DOMAIN = "sweetmeilon.com";
export const PRIMARY_SITE_URL = `https://${PRIMARY_DOMAIN}`;
export const REDIRECT_SOURCE_HOSTS = new Set([
  "www.sweetmeilon.com",
  "sweetmeilon.cn",
  "www.sweetmeilon.cn"
]);

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PRIMARY_SITE_URL;
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const BAIDU_TONGJI_ID = process.env.NEXT_PUBLIC_BAIDU_TONGJI_ID || process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID || "";

export function absoluteUrl(path = "/") {
  return new URL(path, PRIMARY_SITE_URL).toString();
}

export const trustPoints = [
  "官方旗舰店",
  "隐私购买提示",
  "材质质感介绍",
  "清洁保养指南",
  "官方购买渠道"
] as const;

export const complianceNote =
  "本站仅面向年满 18 周岁成年人，页面内容用于品牌介绍和产品选择参考，不构成医疗、健康、情感或能力承诺。";
