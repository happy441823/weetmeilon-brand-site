import type { ProductSpecification, ProductStatus } from "@/types/catalog";

export const highRiskSeoTerms = [
  "可插入",
  "熟女",
  "重口味",
  "成人男士性用品",
  "自慰器",
  "真人1比1",
  "充气娃娃",
  "超大屁股",
  "大屁股",
  "男用玩具",
  "私密陪伴",
  "全自动成人男士用品"
];

const highRiskPattern = new RegExp(highRiskSeoTerms.join("|"), "i");
const dynamicSalesPattern = /近\s*365\s*天付款|付款人数|销量|累计评价|销售数量|热销|爆款|官方立减|已降|平台活动|动态销量|价格|库存|优惠/;
const genericProductNamePattern = /^(半身倒模款|臀部倒模款|自动臀部倒模款|自动倒模款|半身款|臀部款)$/;

type ProductSeoCopyInput = {
  id?: string;
  displayName?: string | null;
  name?: string | null;
  shortName?: string | null;
  status?: ProductStatus | "coming_soon" | string;
  seriesName?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
};

function compactText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasHighRiskSeoTerm(value: unknown) {
  return highRiskPattern.test(compactText(value));
}

function isGenericProductName(value: unknown) {
  return genericProductNamePattern.test(compactText(value));
}

function typeKeyword(input: ProductSeoCopyInput) {
  const source = `${input.subcategoryName || ""} ${input.categoryName || ""} ${input.shortName || ""} ${input.name || ""}`;
  if (/腿/.test(source)) return "腿型倒模款";
  if (/胸/.test(source)) return "胸部倒模款";
  if (/半身/.test(source)) return "半身倒模款";
  if (/臀|下半身/.test(source)) return "臀部倒模款";
  if (/名器|局部/.test(source)) return "局部倒模款";
  if (/飞机杯/.test(source)) return "便携系列";
  return "官方渠道展示款";
}

function seriesKeyword(input: ProductSeoCopyInput) {
  const value = input.seriesName || input.categoryName || "蜜女郎精选";
  if (/原生肌凝硅/.test(value)) return "原生肌凝硅系列";
  if (/细腻|纹理/.test(value)) return "细腻纹理系列";
  if (/入门|安心/.test(value)) return "安心选择系列";
  if (/TPE/.test(value)) return "TPE系列";
  if (/硅胶/.test(value)) return "硅胶系列";
  return value;
}

export function isUpcomingStatus(status: unknown) {
  return status === "upcoming" || status === "coming_soon";
}

export function publicProductDisplayName(input: ProductSeoCopyInput) {
  const raw = compactText(input.displayName || input.name || input.shortName);
  if (raw && !hasHighRiskSeoTerm(raw) && !isGenericProductName(raw)) {
    return raw;
  }

  return `${seriesKeyword(input)}${typeKeyword(input)}｜官方渠道展示`;
}

export function publicProductSeoTitle(input: ProductSeoCopyInput) {
  const name = publicProductDisplayName(input);
  if (isUpcomingStatus(input.status)) {
    return `${name}｜新品预告｜蜜女郎官方渠道说明`;
  }
  return `${name}｜${seriesKeyword(input)}｜蜜女郎官方渠道说明`;
}

export function publicProductSeoDescription(input: ProductSeoCopyInput) {
  const name = publicProductDisplayName(input);
  if (isUpcomingStatus(input.status)) {
    return `了解${name}的新品预告、材质体验方向、清洁保养与隐私购买说明。正式商品信息以上架后的蜜女郎官方旗舰店页面为准。`;
  }
  return `了解${name}的产品类型、材质体验、清洁收纳与隐私购买说明。具体规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。`;
}

export function publicComingSoonSpecifications() {
  return [
    { label: "商品状态", value: "新品预告" },
    { label: "购买状态", value: "暂未开放官网购买入口" },
    { label: "信息说明", value: "正式商品信息以上架后的官方旗舰店页面为准" }
  ];
}

export function removeDynamicSalesCopy(value: unknown) {
  return compactText(value).replace(dynamicSalesPattern, "具体商品信息以官方旗舰店实时页面为准");
}

export function safePublicSpecifications(specifications: ProductSpecification[], status?: unknown) {
  if (isUpcomingStatus(status)) {
    return publicComingSoonSpecifications();
  }

  const allowed = /材质|尺寸|重量|颜色|包含|清洁|收纳|商品状态|关注重点|购买渠道|官方渠道/;
  return specifications
    .filter((spec) => allowed.test(spec.label))
    .filter((spec) => !dynamicSalesPattern.test(`${spec.label} ${spec.value}`))
    .map((spec) => ({ label: spec.label, value: removeDynamicSalesCopy(spec.value) }));
}

export function safePublicTags(tags: string[]) {
  return tags.filter((tag) => !dynamicSalesPattern.test(tag) && !hasHighRiskSeoTerm(tag)).slice(0, 2);
}

export function safeSeoKeywords(keywords: string[]) {
  return keywords
    .filter((keyword) => !/^\d+$/.test(keyword))
    .filter((keyword) => !hasHighRiskSeoTerm(keyword) && !dynamicSalesPattern.test(keyword))
    .slice(0, 6);
}

export function categorySeoTitle(name: string) {
  return `${name}｜产品类型与官方渠道说明｜蜜女郎`;
}

export function categorySeoDescription(name: string) {
  return `浏览蜜女郎${name}相关产品，了解材质体验、清洁保养、隐私购买与官方旗舰店购买入口。具体商品信息以官方渠道页面为准。`;
}

export function containsHighRiskSeoTerm(value: unknown) {
  return hasHighRiskSeoTerm(value);
}

export function containsDynamicSalesCopy(value: unknown) {
  return dynamicSalesPattern.test(compactText(value));
}
