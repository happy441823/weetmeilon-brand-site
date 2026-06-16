# DEPLOYMENT.md

## 本地运行

```bash
npm install
npm run dev
```

打开：

```txt
http://localhost:3000
```

生产构建：

```bash
npm run build
npm run start
```

## 环境变量

```bash
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_TMALL_STORE_URL=https://minvlang.tmall.com/
NEXT_PUBLIC_JD_STORE_URL=https://mall.jd.com/index-127854045.html?cid=0
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_BAIDU_TONGJI_ID=
```

上线前必须替换：

- `NEXT_PUBLIC_SITE_URL`：官网正式域名。
- `NEXT_PUBLIC_TMALL_STORE_URL`：天猫蜜女郎旗舰店真实链接。
- `NEXT_PUBLIC_JD_STORE_URL`：京东蜜女郎旗舰店真实链接。

## Cloudflare Workers 部署

1. 将项目推送到 Git 仓库。
2. 在 Cloudflare 添加 `sweetmeilon.com` 和 `sweetmeilon.cn` 两个站点。
3. 在万网把两个域名的 nameserver 改为 Cloudflare 分配值。
4. 设置环境变量。
5. 使用 Cloudflare Workers 部署当前 Next.js 项目。
6. 绑定自定义域名：
   - `sweetmeilon.com`
   - `www.sweetmeilon.com`
   - `sweetmeilon.cn`
   - `www.sweetmeilon.cn`
7. 在 Cloudflare Rules 中配置 301：
   - `www.sweetmeilon.com` -> `https://sweetmeilon.com`
   - `sweetmeilon.cn` -> `https://sweetmeilon.com`
   - `www.sweetmeilon.cn` -> `https://sweetmeilon.com`
8. 开启 Always Use HTTPS。
9. 检查首页、产品页、文章页、sitemap 和 robots。

## 域名绑定

- 唯一正式主域名使用 `sweetmeilon.com`。
- 不使用 `www` 作为主站。
- `sweetmeilon.cn` 只做品牌保护和 301 跳转。
- 域名生效后更新 `NEXT_PUBLIC_SITE_URL=https://sweetmeilon.com`。

## HTTPS 检查

- `https://sweetmeilon.com` 必须可访问。
- `robots.txt` 和 `sitemap.xml` 必须返回 `.com` 地址。
- `.cn` 与 `www` 必须 301 到 `https://sweetmeilon.com`。
- 浏览器地址栏不应出现 mixed content 警告。

## sitemap 提交

生成地址：

```txt
https://你的域名/sitemap.xml
```

提交到：

- Google Search Console
- 百度搜索资源平台

## 搜索平台接入

Google Search Console：

1. 添加域名资源。
2. 按 DNS TXT 或 HTML 文件验证。
3. 提交 sitemap。
4. 检查索引覆盖和搜索表现。

百度站长：

1. 添加站点。
2. 完成站点验证。
3. 提交 sitemap。
4. 关注品牌词、隐私发货和材质词收录。
