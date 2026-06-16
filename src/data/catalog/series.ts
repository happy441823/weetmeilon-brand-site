import type { CatalogSeries } from "@/types/catalog";

export const catalogSeries: CatalogSeries[] = [
  {
    id: "native-skin-silicone",
    slug: "native-skin-silicone",
    name: "原生肌凝硅系列",
    description: "围绕柔软、回弹、细腻表面与日常清洁体验表达的品牌材质系列。",
    coverImage: "/images/series/native-skin-silicone.png",
    sortOrder: 10,
    visible: true
  },
  {
    id: "fine-texture",
    slug: "fine-texture",
    name: "细腻纹理系列",
    description: "更强调表面纹理、局部层次与视觉细节的选择方向。",
    coverImage: "/images/series/fine-texture.png",
    sortOrder: 20,
    visible: true
  },
  {
    id: "beginner",
    slug: "beginner",
    name: "安心入门系列",
    description: "适合初次了解蜜女郎时先查看产品信息、隐私包装与清洁方式。",
    coverImage: "/images/series/beginner.png",
    sortOrder: 30,
    visible: true
  }
];
