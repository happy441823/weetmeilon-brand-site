# 商品复核指南

## 必看文件

- `data/catalog/review/products-review.csv`
- `data/catalog/review/product-matching.csv`
- `data/catalog/review/category-suggestions.csv`
- `src/data/catalog/manual-overrides.ts`

## 同款确认标准

只有同时满足以下条件，才可标记为 `confirmed`：

- 天猫与京东均为蜜女郎官方渠道
- 商品名称、主图、款式和规格明确一致
- 商品详情页 URL 可公开访问
- 不依赖价格、库存、销量或评价来判断同款

不确定时保持 `needs_review`，不得强行合并。

## 半身款需要补充

- 天猫商品详情页 URL
- 京东商品详情页 URL
- 商品主图
- 商品规格信息
- 是否首页推荐
- 是否属于某个材质系列

确认后再将正式商品设置为 `active`。
