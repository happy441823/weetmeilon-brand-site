# 蜜女郎官网上线检查清单

## 上线前必须完成

1. 确认 `.env.local` 或生产平台环境变量已配置 `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_TMALL_STORE_URL`、`NEXT_PUBLIC_JD_STORE_URL`。
2. 如未接入统计，保持 `NEXT_PUBLIC_GA4_ID` 和 `NEXT_PUBLIC_BAIDU_TONGJI_ID` 为空。
3. 执行 `npm run catalog:validate`。
4. 执行 `npm run catalog:check-links`。
5. 执行 `npm run catalog:check-images`。
6. 执行 `npm run lint`。
7. 执行 `npm run build`。
8. 本地或 preview 检查首页、产品中心、3 个商品详情页、FAQ、隐私政策、用户协议、免责声明、联系页、404。
9. 检查 `/sitemap.xml` 只包含公开页面、已审核商品、有公开商品的分类和已发布文章。
10. 检查 `/robots.txt` 在正式域名允许公开页面抓取，并屏蔽 `/admin/`、`/api/`、`/internal/`。

## 人工验收

1. 首次访问必须出现年龄确认弹窗，确认后不重复弹出。
2. 未满 18 岁或暂不访问按钮进入 `/not-for-minors`。
3. upcoming 商品不显示天猫/京东购买按钮。
4. active 商品只显示已确认的官方购买入口。
5. 商品卡片不显示价格、销量、付款人数、内部 ID、抓取来源或审核状态。
6. 移动端 375px、390px、430px、768px、1024px、1440px 都需要检查无文字重叠。

## 生产部署后

1. 检查 HTTPS。
2. 检查正式域名和 www 跳转规则。
3. 打开 `/products`、`/sitemap.xml`、`/robots.txt`。
4. 点击天猫和京东入口，确认能到官方店铺或商品详情页。
5. 记录上线时间、部署平台、环境变量和当前 Git 版本。
