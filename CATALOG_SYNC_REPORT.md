# 商品目录同步报告

更新时间：2026-06-13 11:23（Asia/Shanghai）

## 官方店铺入口

- 天猫店铺 URL：`https://minvlang.tmall.com/`
- 京东店铺 URL：`https://mall.jd.com/index-127854045.html?cid=0`

## 公开访问结果

- 天猫：公开访问进入登录/跳转链，最终未返回稳定商品列表。本轮未绕过登录、验证码或平台限制。
- 京东：公开 HTML 可访问，页面 title 与 meta 显示“蜜女郎 SWEETMEILON官方旗舰店 - 京东”；但商品列表由动态模块加载，本轮未稳定获取可绑定的 `item.jd.com` 商品详情 URL。

## 商品发现数量

- 天猫公开商品：0
- 京东公开商品：0
- 自动确认同款：0 组
- 进入人工复核：1 个商品候选

## 半身款复核状态

用户说明半身款为已上架商品，且天猫、京东均有对应商品链接。但本轮公开页面未能确认具体商品详情页，也无法验证两平台是否为同款。

当前处理：

- 正式目录中建立 `half-body-public-review`
- 状态为 `draft`
- `visible: false`
- 不在前台展示
- 不显示天猫或京东购买按钮
- 复核文件：`data/catalog/review/product-matching.csv`

## 原生肌凝硅三款新品

以下 3 个商品均已设置为：

- `status: "upcoming"`
- `visible: true`
- `featured: true`
- `launchDate: null`
- 不显示购买按钮、价格、库存、销量、评价或上架日期

商品：

- `native-skin-silicone-soft`
- `texture-detail-series`
- `privacy-starter-kit`

## 图片缺失

当前以下真实商品图片仍需补充：

- `/images/products/product-01.png`
- `/images/products/product-02.png`
- `/images/products/product-03.png`
- `/images/products/half-body-public-review/cover.png`

缺失图片不会阻塞构建，前端会显示品牌渐变背景；上线前建议补齐真实图。

## 后续同步

```bash
npm run catalog:discover
npm run catalog:normalize
npm run catalog:match
npm run catalog:review
npm run catalog:validate
```

`catalog:sync` 不会直接覆盖正式商品数据。确认商品链接后，请优先写入 `src/data/catalog/manual-overrides.ts`。
