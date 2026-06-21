import type { CatalogSeries } from "@/types/catalog";

export const catalogSeries: CatalogSeries[] = [
  {
    id: "hip-mold-series",
    slug: "hip-mold-series",
    name: "臀部倒模系列",
    description: "围绕臀部轮廓、材质触感和清洁收纳说明整理的产品系列。",
    coverImage: "/images/series/fine-texture.png",
    sortOrder: 10,
    visible: true
  },
  {
    id: "half-body-doll-series",
    slug: "half-body-doll-series",
    name: "半身娃娃系列",
    description: "半身形态产品，适合按尺寸、结构和护理方式进行对比。",
    coverImage: "/images/series/beginner.png",
    sortOrder: 20,
    visible: true
  },
  {
    id: "silicone-mold-series",
    slug: "silicone-mold-series",
    name: "硅胶倒模系列",
    description: "硅胶材质方向的倒模产品系列。",
    coverImage: "/images/series/native-skin-silicone.png",
    sortOrder: 30,
    visible: true
  },
  {
    id: "realistic-doll-series",
    slug: "realistic-doll-series",
    name: "实体娃娃系列",
    description: "实体娃娃产品系列，按材质和形态进行整理。",
    coverImage: "/images/series/beginner.png",
    sortOrder: 40,
    visible: true
  },
  {
    id: "masturbator-cup-series",
    slug: "masturbator-cup-series",
    name: "飞机杯系列",
    description: "飞机杯及相关产品系列。",
    coverImage: "/images/series/fine-texture.png",
    sortOrder: 50,
    visible: true
  },
  {
    id: "native-skin-silicone",
    slug: "native-skin-silicone",
    name: "原生肌凝硅系列",
    description: "历史材质专题系列，仅用于三款新品与专题内容，不进入产品中心筛选。",
    coverImage: "/images/series/native-skin-silicone.png",
    sortOrder: 900,
    visible: false
  },
  {
    id: "fine-texture",
    slug: "fine-texture",
    name: "细腻纹理系列",
    description: "历史系列，仅用于数据兼容。",
    coverImage: "/images/series/fine-texture.png",
    sortOrder: 910,
    visible: false
  },
  {
    id: "beginner",
    slug: "beginner",
    name: "安心入门系列",
    description: "历史系列，仅用于数据兼容。",
    coverImage: "/images/series/beginner.png",
    sortOrder: 920,
    visible: false
  }
];
