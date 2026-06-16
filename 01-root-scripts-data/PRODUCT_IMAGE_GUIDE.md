# 商品图片规范

## 产品主图

- 推荐尺寸：1200 x 1200px
- 推荐格式：WebP；源素材可保留 PNG / JPG / WebP
- 单张尽量控制在 500KB 以内
- 正式页面只读取：`public/images/products/{product-id}/approved/cover.webp`
- 原始素材保留在：`public/images/products/{product-id}/source/`
- 当前三款新品临时路径：
  - `public/images/products/product-01.png`
  - `public/images/products/product-02.png`
  - `public/images/products/product-03.png`

## 商家后台素材中心

- 白底图与透明图来源：天猫/千牛商家后台「素材中心」。
- 已抓取素材清单：`data/catalog/raw/qn-material-center-assets-2026-06-14.json`
- 图片审核记录：`data/catalog/review/product-image-review.csv`
- 已合成官网主图：26 张，路径为 `public/images/products/tmall-{item-id}/approved/cover.webp`
- 后台显示“审核不通过”或“审核中”的白底图只作为真实商品主体来源，不代表官网免复核通过。

## 半身款

确认商品后建议使用：

- `public/images/products/tmall-856316241725/source/material-center-transparent.webp`
- `public/images/products/tmall-856316241725/approved/cover.webp`

## 品牌细节图

- 推荐尺寸：1200 x 900px
- 推荐格式：JPG、WebP 或 PNG
- 构图重点：材质、包装、隐私发货、清洁收纳

## 表达边界

- 不使用露骨或低俗画面
- 不展示买家图、用户昵称、订单信息
- 不虚构检测报告、认证、销量或功效承诺
- 不改变平台商品图中的产品结构、比例和颜色
- AI 或脚本只允许重构背景、灯光和构图，不重画商品主体
