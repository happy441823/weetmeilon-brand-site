# 后台 CMS 设置说明

## Preview 初始化

1. 进入 Cloudflare 控制台。
2. 打开 Workers & Pages，找到 SWEETMEILON 项目的 Preview 环境。
3. 创建开发 D1：`sweetmeilon-cms-dev`。
4. 创建开发 R2：`sweetmeilon-cms-media-dev`。
5. 将 `wrangler.jsonc` 中 `REPLACE_WITH_DEV_D1_DATABASE_ID` 替换为开发 D1 的 ID。
6. 配置 Cloudflare Access，并设置 Preview 环境变量：
   - `CF_ACCESS_AUDIENCE`
   - `CF_ACCESS_ISSUER`
   - `CMS_ALLOW_LOCAL_ADMIN=false`
7. 执行迁移：

```bash
npm ci
npm run cms:migrate:preview
npm run cf-typegen
```

## 创建初始 super_admin

不得通过公开 HTTP 请求自动授予 `super_admin`。初始管理员只能通过一次性 CLI 在 D1 中创建。

Preview 远程 D1：

```bash
npm run cms:bootstrap-admin -- --email owner@example.com --name "Owner" --database sweetmeilon-cms-dev --env preview --remote --yes
```

本地 D1：

```bash
npm run cms:bootstrap-admin -- --email owner@example.com --database sweetmeilon-cms-dev --env preview --local --yes
```

验证 SQL：

```bash
npm run cms:bootstrap-admin -- --email owner@example.com --verify
```

预览将要执行的 SQL：

```bash
npm run cms:bootstrap-admin -- --email owner@example.com --print-sql
```

## 本地开发绕过

开发期间可以在本地 `.env.local` 临时设置：

```text
CMS_ALLOW_LOCAL_ADMIN=true
CMS_LOCAL_ADMIN_EMAIL=owner@example.com
```

该绕过只在 `NODE_ENV` 不是 `production`，且请求 URL 是 localhost 或 `127.0.0.1` 时生效。Preview 和 Production 必须保持 `CMS_ALLOW_LOCAL_ADMIN=false`。

生产 D1/R2 不要在验收前创建或迁移数据。
