# 域名与跳转配置说明

## 最终平台

- 最终部署平台：Cloudflare
- 推荐运行形态：Cloudflare Workers
- 不建议将当前项目按静态导出方式部署到 Cloudflare Pages

说明：

- Cloudflare 官方当前文档将全栈 SSR Next.js 指向 Workers 方案。
- 当前项目包含动态路由和 middleware，更适合 Workers。

## 唯一正式主域名

- 正式主域名：`https://sweetmeilon.com`
- 品牌保护域名：`https://sweetmeilon.cn`
- 全站 canonical 只使用：`https://sweetmeilon.com`
- `robots.txt` 和 `sitemap.xml` 只由 `sweetmeilon.com` 提供
- `sweetmeilon.cn` 不单独提供内容，不单独提供 sitemap

## 目标跳转

以下地址全部 301 到 `https://sweetmeilon.com`：

- `https://www.sweetmeilon.com`
- `http://sweetmeilon.com`
- `http://www.sweetmeilon.com`
- `https://sweetmeilon.cn`
- `https://www.sweetmeilon.cn`
- `http://sweetmeilon.cn`
- `http://www.sweetmeilon.cn`

## 当前代码状态

应用内已经完成：

- canonical 固定到 `https://sweetmeilon.com`
- `robots.txt` 只输出 `https://sweetmeilon.com/sitemap.xml`
- `sitemap.xml` 只输出 `.com`
- `.com/.cn/www/http` 统一跳转到 `https://sweetmeilon.com`

## 你在万网需要做的事

如果最终使用 Cloudflare 作为正式平台，推荐使用 Cloudflare Full setup。

这意味着：

1. 在 Cloudflare 添加 `sweetmeilon.com` 和 `sweetmeilon.cn` 两个站点
2. Cloudflare 会给每个域名分配一组 nameservers
3. 回到万网，把这两个域名的 nameservers 改成 Cloudflare 提供的值

完成后：

- DNS 不再以万网控制台里的 A/CNAME 为准
- 你需要在 Cloudflare DNS 面板维护记录

## Cloudflare DNS 建议

当 nameserver 已切到 Cloudflare 后，在 Cloudflare DNS 中配置：

### sweetmeilon.com

- `CNAME`：`www -> sweetmeilon.com`

根域名 `@` 不要再指向 Vercel。
根域名将由 Cloudflare Workers 自定义域名接管。

### sweetmeilon.cn

- `CNAME`：`www -> sweetmeilon.cn`

根域名 `@` 同样由 Cloudflare 自定义域名接管。

## Cloudflare 侧建议配置

### Workers

把 Next.js 项目部署为 Cloudflare Workers。

### Custom Domains

为 Worker 绑定：

- `sweetmeilon.com`
- `www.sweetmeilon.com`
- `sweetmeilon.cn`
- `www.sweetmeilon.cn`

### Redirect Rules

在 Cloudflare Rules 中建立 301 规则，统一跳到：

- `https://sweetmeilon.com`

规则目标：

- `www.sweetmeilon.com/*` -> `https://sweetmeilon.com/$1`
- `sweetmeilon.cn/*` -> `https://sweetmeilon.com/$1`
- `www.sweetmeilon.cn/*` -> `https://sweetmeilon.com/$1`

同时开启：

- Always Use HTTPS

## 单跳要求

上线后要满足：

- `http://sweetmeilon.com/path` -> `https://sweetmeilon.com/path`
- `https://www.sweetmeilon.com/path` -> `https://sweetmeilon.com/path`
- `https://sweetmeilon.cn/path` -> `https://sweetmeilon.com/path`
- `https://www.sweetmeilon.cn/path` -> `https://sweetmeilon.com/path`

都只跳一次，不形成跳转链。

## 上线前检查

1. `NEXT_PUBLIC_SITE_URL=https://sweetmeilon.com`
2. Cloudflare 中 `sweetmeilon.com` 作为正式内容域名
3. `.cn` 与 `www` 只做 301
4. HTTPS 正常签发
5. `robots.txt` 和 `sitemap.xml` 都只显示 `.com`
