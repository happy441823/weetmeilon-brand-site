# 商品管理说明

## 数据优先级

1. `src/data/catalog/manual-overrides.ts`
2. `src/data/catalog/generated-overrides.json`
3. `src/data/catalog/products.ts`
4. `data/catalog/normalized/products.discovered.json`
5. 默认值

前端页面只读取正式商品目录，不直接读取 raw 或 normalized 数据。

## 商品状态

- `draft`：内部草稿，不公开
- `upcoming`：新品预告，可展示，不可购买
- `active`：已上架，可展示已确认平台按钮
- `discontinued`：已下架，默认隐藏

## 新品预告规则

原生肌凝硅三款目前必须保持：

```ts
status: "upcoming"
visible: true
featured: true
launchDate: null
```

不得显示天猫、京东购买按钮，不得写价格、库存、销量、评价或上架日期。

## 已上架商品上线流程

1. 获取天猫商品详情页链接和京东商品详情页链接。
2. 确认店铺为蜜女郎官方旗舰店或京东官方旗舰店。
3. 确认两平台商品名称、主图、规格和款式是否为同款。
4. 从商家后台素材中心补齐白底图或透明图。
5. 执行 `python -X utf8 scripts/prepare-material-assets.py`，生成 `approved/cover.webp` 与审核 CSV。
6. 更新 `data/catalog/review/product-matching.csv` 的复核状态。
7. 必要时在 `src/data/catalog/manual-overrides.ts` 写入人工覆盖。
8. 将商品状态改为 `active`，并设置 `visible`、`featured`。
9. 执行 `npm run catalog:validate`、`npm run catalog:check-images`、`npm run lint`、`npm run build`。

## 发布条件

active 商品进入公开页面必须满足：

- `status === "active"`
- `visible === true`
- 至少一个已验证天猫或京东商品链接
- 已生成 `approved/cover.webp`
- 有官网展示名称与确认分类
- `publishReady === true`

不满足条件的商品保留在内部目录、CSV 和报告中，不进入公开产品列表。

## 半身款当前状态

天猫半身款 `tmall-856316241725` 已匹配素材中心透明图，并生成官网主图：

- `public/images/products/tmall-856316241725/source/material-center-transparent.webp`
- `public/images/products/tmall-856316241725/approved/cover.webp`

京东同款商品级链接仍待确认；未确认前不显示京东同款按钮。
