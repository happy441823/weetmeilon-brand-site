# 蜜女郎官网日常维护清单

## 每周

1. 检查首页和产品中心是否正常。
2. 检查移动端菜单和购买入口。
3. 检查天猫、京东按钮是否能打开。
4. 检查 404 页面。
5. 执行 `npm run catalog:check-images`。
6. 执行 `npm run build`。

## 每月

1. 检查商品链接是否失效。
2. 检查隐私政策是否与实际统计工具一致。
3. 检查 sitemap 和 robots。
4. 检查 Search Console 或百度站长平台。
5. 备份生产环境变量和最近稳定版本。

## 每次新增商品

1. 先在 `/internal/product-editor` 生成商品资料。
2. 确认商品图片放在 approved 目录。
3. 确认 active 商品有官方购买链接。
4. 执行 `npm run catalog:validate`。
5. 执行 `npm run catalog:check-links`。
6. 执行 `npm run catalog:check-images`。
7. 执行 `npm run lint`。
8. 执行 `npm run build`。
