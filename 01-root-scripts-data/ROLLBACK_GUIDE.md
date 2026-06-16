# 蜜女郎官网回滚说明

## 回滚前记录

1. 当前线上版本或 Git commit。
2. 当前生产环境变量。
3. 当前部署平台项目名和域名。
4. 问题页面 URL、截图和复现步骤。

## Vercel 回滚

1. 进入 Vercel 项目。
2. 打开 Deployments。
3. 找到上一个稳定部署。
4. 选择 Promote to Production。
5. 回滚后检查首页、产品中心、商品详情、sitemap、robots。

## Cloudflare Pages 回滚

1. 进入 Cloudflare Pages 项目。
2. 打开 Deployments。
3. 找到上一个稳定部署。
4. 选择 Rollback 或重新部署该版本。
5. 回滚后检查正式域名和 HTTPS。

## 本地数据回滚

1. 不删除历史商品数据。
2. 商品下线使用 `status: "discontinued"` 和 `visible: false`。
3. 如果是新增商品导致问题，先把该商品改成 `draft` 或 `visible: false`。
4. 再执行 `npm run catalog:validate`、`npm run lint`、`npm run build`。

## 环境变量备份

上线前备份以下变量：

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TMALL_STORE_URL=
NEXT_PUBLIC_JD_STORE_URL=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_BAIDU_TONGJI_ID=
ADMIN_UPLOAD_PASSWORD=
```
