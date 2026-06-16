# 商品添加指南

## 添加一款已上架商品

1. 准备真实产品主图，推荐 `1200 x 900 px`。
2. 建立商品 ID，例如 `tmall-123456789`。
3. 建立目录：`public/images/products/{product-id}/source/` 和 `public/images/products/{product-id}/approved/`。
4. 原图放入 `source`，官网主图放入 `approved/cover.webp`。
5. 打开本地录入工具：`/internal/product-editor`。
6. 填写商品名称、短名称、一级分类、二级分类、标签、简介、详情、特点和清洁说明。
7. 填写天猫或京东商品详情页链接。
8. active 商品必须有主图、购买链接、人工确认内容。
9. 下载 JSON 或复制 TypeScript 数据。
10. 把确认后的商品数据加入 `src/data/catalog/manual-products.ts`。
11. 执行 `npm run catalog:validate`、`npm run catalog:check-links`、`npm run catalog:check-images`、`npm run lint`、`npm run build`。
12. 本地预览确认无误后再提交和部署。

## 添加一款即将上新商品

1. `status` 使用 `upcoming`。
2. 不填写天猫或京东购买链接。
3. 不显示购买按钮。
4. 可以填写新品定位、简介和特点。
5. 正式上架后再改为 `active`，并补主图、购买链接和人工审核状态。

## 替换商品图片

1. 原图放入 `public/images/products/{product-id}/source/`。
2. 官网使用图放入 `public/images/products/{product-id}/approved/cover.webp`。
3. `coverImage` 只填写 approved 路径。
4. 不要用平台促销海报作为官网主图。
5. 执行 `npm run catalog:check-images`。

## 商品下架

不要删除历史商品。下架时改为：

```ts
status: "discontinued",
visible: false
```
