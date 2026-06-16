# 商品分类体系修改执行报告

执行日期：2026-06-14

## 新增一级分类

- `tpe-mold`：TPE倒模
- `silicone-mold`：硅胶倒模
- `realistic-dolls`：实体娃娃
- `masturbator-cups`：飞机杯系列

## 新增二级小类

TPE倒模：

- `tpe-hip-mold`：TPE臀模系列
- `tpe-half-body`：TPE半身系列
- `tpe-local-mold`：TPE名器系列
- `tpe-leg-mold`：TPE腿模系列
- `tpe-chest-mold`：TPE胸模系列

硅胶倒模：

- `silicone-hip-mold`：硅胶臀模系列
- `silicone-half-body`：硅胶半身系列
- `silicone-local-mold`：硅胶名器系列
- `silicone-leg-mold`：硅胶腿模系列
- `silicone-chest-mold`：硅胶胸模系列

实体娃娃：

- `tpe-realistic-dolls`：TPE实体娃娃
- `silicone-realistic-dolls`：硅胶实体娃娃

## 原生肌凝硅系列处理

`native-skin-silicone` 继续作为产品系列维护，不作为一级或二级分类。

三款新品目前根据 PDF 要求不猜具体二级形态：

- `native-skin-silicone-soft`：一级类目暂挂 `silicone-mold`，二级小类 `null`，分类状态 `needs-review`。
- `texture-detail-series`：一级类目暂挂 `silicone-mold`，二级小类 `null`，分类状态 `needs-review`。
- `privacy-starter-kit`：一级类目暂挂 `masturbator-cups`，二级小类 `null`，分类状态 `needs-review`。

## 页面调整

- 首页“按类型浏览”只展示 4 个一级类目。
- 产品中心筛选器改为：一级分类、二级小类、产品系列、状态和关键词。
- 分类路由 `/products/category/[slug]` 支持一级分类和二级小类。
- sitemap 只收录有公开商品的一级/二级分类。
- 旧分类 `half-body / hip-lower-body / local-mold / wearable / care-accessories / other` 已改为 legacy，不进入主导航。

## 迁移复核结果

- 已创建 `data/catalog/review/category-migration-review.csv`。
- 迁移对象：30 个天猫在售商品覆盖记录。
- 可给出高置信度新分类建议：4 个。
- 仍需人工确认材质或形态：26 个。
- 规则：无法确认 TPE 或硅胶时不猜材质；无法确认具体形态时不写入正式二级小类。

## 验证

- `tsc --noEmit` 通过。
- `scripts/validate-catalog.mjs` 通过。
- `scripts/check-product-images.mjs` 通过。
- `next build` 通过。
- 本地 `/products`、`/products?status=upcoming`、`/products/category/silicone-mold`、`/sitemap.xml` 返回 200。
