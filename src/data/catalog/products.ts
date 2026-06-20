import type { CatalogProduct } from "@/types/catalog";
import { userCatalogProducts } from "./manual-products";
import { tmallLiveProducts } from "./tmall-live-products";

const emptyChannelLinks = {
  tmall: {
    enabled: false,
    url: null,
    label: "查看天猫同款",
    verified: false,
    sourceUrl: null,
    lastCheckedAt: null
  },
  jd: {
    enabled: false,
    url: null,
    label: "查看京东同款",
    verified: false,
    sourceUrl: null,
    lastCheckedAt: null
  }
} as const;

export const upcomingProductNotice =
  "本页面为新品预告，具体名称、材质、规格、颜色、上架时间及购买渠道，以蜜女郎天猫或京东官方旗舰店正式上架页面为准。";

const manualCatalogProducts: CatalogProduct[] = [
  {
    id: "native-skin-silicone-soft",
    slug: "native-skin-silicone-soft",
    skuCode: "UPCOMING-NSG-01",
    name: "原生肌凝硅 · 柔感系列",
    shortName: "柔感系列",
    subtitle: "围绕柔软、回弹与细腻表面体验展开的新品预告。",
    categoryId: "other",
    primaryCategoryId: "silicone-mold",
    subcategoryId: null,
    categoryReviewStatus: "needs-review",
    seriesId: "native-skin-silicone",
    tags: ["即将上新", "柔软回弹", "易清洁"],
    status: "upcoming",
    visible: true,
    featured: true,
    sortOrder: 10,
    launchDate: null,
    coverImage: "/images/products/product-01.png",
    gallery: [],
    imageAlt: "蜜女郎原生肌凝硅柔感系列产品主视觉",
    imageTag: "柔软回弹",
    shortDescription: "围绕柔软、回弹与细腻表面体验展开，适合优先关注材质触感的用户。",
    fullDescription: "原生肌凝硅是蜜女郎用于表达材质质感升级的品牌材质概念，重点放在柔软、回弹、细腻表面与日常清洁体验。我们不会把它包装成医疗功效、安全认证或无法证明的承诺。",
    heroLine: "从柔软、回弹与细腻表面，理解这一系列的材质体验方向。",
    bestFor: ["优先关注材质触感", "更在意柔软与回弹", "希望先了解清洁与保养方式"],
    highlights: [
      "本款目前为新品预告，不展示天猫或京东商品购买按钮。",
      "页面说明聚焦材质触感和日常清洁，不把品牌概念描述为认证、专利或医疗材料。",
      upcomingProductNotice
    ],
    specifications: [
      { label: "商品状态", value: "即将上新" },
      { label: "材质表达", value: "原生肌凝硅品牌材质概念" },
      { label: "购买渠道", value: "正式上架后以官方旗舰店页面为准" }
    ],
    careNotes: ["使用前后建议按正式商品说明清洁", "避免与深色或易染色材料长期贴合", "充分晾干后独立收纳"],
    privacyNotes: ["正式发货规则以上架后的天猫或京东官方旗舰店页面为准"],
    channelLinks: emptyChannelLinks,
    sourceRecords: [],
    verificationStatus: "needs_review",
    seoTitle: "原生肌凝硅柔感系列新品预告｜蜜女郎 SWEETMEILON",
    seoDescription: "蜜女郎原生肌凝硅柔感系列新品预告，聚焦柔软、回弹、细腻表面和日常清洁体验，不展示未上架商品购买按钮。",
    seoKeywords: ["原生肌凝硅", "新品预告", "柔软回弹", "蜜女郎"],
    createdAt: "2026-06-13T00:00:00+08:00",
    updatedAt: "2026-06-13T00:00:00+08:00"
  },
  {
    id: "texture-detail-series",
    slug: "texture-detail-series",
    skuCode: "UPCOMING-NSG-02",
    name: "细腻纹理 · 质感系列",
    shortName: "质感系列",
    subtitle: "更强调表面纹理、局部层次与视觉细节的新品预告。",
    categoryId: "local-mold",
    primaryCategoryId: "silicone-mold",
    subcategoryId: null,
    categoryReviewStatus: "needs-review",
    seriesId: "fine-texture",
    tags: ["即将上新", "细腻纹理", "选择参考"],
    status: "upcoming",
    visible: true,
    featured: true,
    sortOrder: 20,
    launchDate: null,
    coverImage: "/images/products/product-02.png",
    gallery: [],
    imageAlt: "蜜女郎细腻纹理质感系列产品主视觉",
    imageTag: "细腻纹理",
    shortDescription: "更强调表面纹理、局部层次与视觉细节，适合希望比较产品细节差异的用户。",
    fullDescription: "这一新品方向用于帮助用户理解表面层次、边缘过渡与清洁方式之间的关系。正式商品信息仍需以上架后的官方旗舰店详情页为准。",
    heroLine: "从纹理区域、边缘过渡与表面处理方式，比较细节层次。",
    bestFor: ["更在意细节层次", "想比较表面纹理差异", "需要先看清洁与收纳说明"],
    highlights: [
      "本款目前为新品预告，不展示天猫或京东商品购买按钮。",
      "建议结合正式商品图、清洁方式和具体规格一起判断是否适合自己。",
      upcomingProductNotice
    ],
    specifications: [
      { label: "商品状态", value: "即将上新" },
      { label: "关注重点", value: "纹理 / 层次 / 表面细节" },
      { label: "购买渠道", value: "正式上架后以官方旗舰店页面为准" }
    ],
    careNotes: ["纹理区域清洁时避免粗糙刷具", "使用温和清洁方式", "收纳前确认表面完全干燥"],
    privacyNotes: ["正式发货规则以上架后的天猫或京东官方旗舰店页面为准"],
    channelLinks: emptyChannelLinks,
    sourceRecords: [],
    verificationStatus: "needs_review",
    seoTitle: "细腻纹理质感系列新品预告｜蜜女郎 SWEETMEILON",
    seoDescription: "蜜女郎细腻纹理质感系列新品预告，帮助理解表面纹理、局部层次与清洁保养方式。",
    seoKeywords: ["细腻纹理", "新品预告", "硅胶产品怎么选", "蜜女郎"],
    createdAt: "2026-06-13T00:00:00+08:00",
    updatedAt: "2026-06-13T00:00:00+08:00"
  },
  {
    id: "privacy-starter-kit",
    slug: "privacy-starter-kit",
    skuCode: "UPCOMING-NSG-03",
    name: "安心选择 · 入门系列",
    shortName: "入门系列",
    subtitle: "围绕产品信息、隐私包装与基础清洁方式的新品预告。",
    categoryId: "other",
    primaryCategoryId: "masturbator-cups",
    subcategoryId: null,
    categoryReviewStatus: "needs-review",
    seriesId: "beginner",
    tags: ["即将上新", "安心入门", "隐私说明"],
    status: "upcoming",
    visible: true,
    featured: true,
    sortOrder: 30,
    launchDate: null,
    coverImage: "/images/products/product-03.png",
    gallery: [],
    imageAlt: "蜜女郎安心选择入门系列产品主视觉",
    imageTag: "安心入门",
    shortDescription: "重点梳理产品信息、隐私包装与清洁方式，适合第一次了解蜜女郎的用户。",
    fullDescription: "这一新品方向强调购买前的基础信息透明度，包括如何阅读商品说明、如何关注隐私发货规则以及如何进行日常清洁与收纳。",
    heroLine: "先了解产品信息、隐私包装与基础清洁方式，再查看具体规格。",
    bestFor: ["更关心隐私包装和官方渠道", "希望先了解基础清洁保养", "第一次了解蜜女郎"],
    highlights: [
      "本款目前为新品预告，不展示天猫或京东商品购买按钮。",
      "页面用于帮助第一次了解蜜女郎的用户先确认常见问题。",
      upcomingProductNotice
    ],
    specifications: [
      { label: "商品状态", value: "即将上新" },
      { label: "关注重点", value: "隐私 / 官方 / 易清洁" },
      { label: "购买渠道", value: "正式上架后以官方旗舰店页面为准" }
    ],
    careNotes: ["先读清洁指南再使用", "按说明进行日常清洁与晾干", "独立收纳，减少灰尘附着"],
    privacyNotes: ["正式发货规则以上架后的天猫或京东官方旗舰店页面为准"],
    channelLinks: emptyChannelLinks,
    sourceRecords: [],
    verificationStatus: "needs_review",
    seoTitle: "安心选择入门系列新品预告｜蜜女郎 SWEETMEILON",
    seoDescription: "蜜女郎安心选择入门系列新品预告，围绕隐私发货、清洁保养和官方渠道做购买前说明。",
    seoKeywords: ["新品预告", "隐私发货", "清洁保养", "蜜女郎官方"],
    createdAt: "2026-06-13T00:00:00+08:00",
    updatedAt: "2026-06-13T00:00:00+08:00"
  },
  {
    id: "half-body-public-review",
    slug: "half-body-public-review",
    skuCode: "MANUAL-HALF-BODY-REVIEW",
    name: "半身款（待官方链接复核）",
    shortName: "半身款",
    subtitle: "用户确认存在已上架半身款，商品级链接待人工复核后公开。",
    categoryId: "half-body",
    primaryCategoryId: null,
    subcategoryId: null,
    categoryReviewStatus: "needs-review",
    seriesId: null,
    tags: ["人工复核", "半身系列"],
    status: "draft",
    visible: false,
    featured: false,
    sortOrder: 900,
    launchDate: null,
    coverImage: "/images/products/half-body-public-review/cover.png",
    gallery: [],
    imageAlt: "蜜女郎半身款待复核商品图",
    imageTag: "待复核",
    shortDescription: "该商品目前仅作为内部复核记录，不在前台公开展示。",
    fullDescription: "用户说明该半身款已经上架且天猫、京东均有对应商品链接。当前公开访问未能稳定确认具体商品详情页，因此暂不公开展示，不绑定购买按钮。",
    heroLine: "待人工确认天猫与京东同款关系后再公开。",
    bestFor: ["需要补充天猫商品详情页链接", "需要补充京东商品详情页链接", "需要确认两平台是否为同款"],
    highlights: ["未获取到可确认商品详情页 URL。", "不得使用店铺首页冒充商品级同款链接。", "人工复核后可通过 manual overrides 发布。"],
    specifications: [
      { label: "商品状态", value: "内部草稿" },
      { label: "复核重点", value: "天猫 / 京东商品详情页与同款关系" }
    ],
    careNotes: [],
    privacyNotes: [],
    channelLinks: emptyChannelLinks,
    sourceRecords: [
      {
        platform: "manual",
        storeUrl: "",
        productUrl: null,
        collectedAt: "2026-06-13T11:23:00+08:00",
        method: "manual_note",
        note: "用户说明半身款为已上架商品，但本轮公开访问未确认商品级链接。"
      }
    ],
    verificationStatus: "needs_review",
    seoTitle: "半身款待复核｜蜜女郎 SWEETMEILON",
    seoDescription: "蜜女郎半身款内部复核记录，商品链接确认前不公开展示。",
    seoKeywords: ["蜜女郎半身款", "人工复核", "官方旗舰店"],
    createdAt: "2026-06-13T00:00:00+08:00",
    updatedAt: "2026-06-13T00:00:00+08:00"
  }
];

export const baseCatalogProducts: CatalogProduct[] = [
  ...manualCatalogProducts,
  ...userCatalogProducts,
  ...tmallLiveProducts
];
