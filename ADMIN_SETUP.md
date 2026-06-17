# 后台 CMS 设置说明

1. 进入 Cloudflare 控制台。
2. 打开 Workers & Pages，找到 SWEETMEILON 项目的 Preview 环境。
3. 创建开发 D1：`sweetmeilon-cms-dev`。
4. 创建开发 R2：`sweetmeilon-cms-media-dev`。
5. 将 `wrangler.jsonc` 中 `REPLACE_WITH_DEV_D1_DATABASE_ID` 替换为开发 D1 的 ID。
6. 本地执行：

```bash
npm ci
npm run cms:migrate:preview
npm run cf-typegen
npm run build
npx @opennextjs/cloudflare build
```

开发期间可设置环境变量：

```text
CMS_ALLOW_LOCAL_ADMIN=true
CMS_LOCAL_ADMIN_EMAIL=你的测试管理员邮箱
```

生产 D1/R2 不要在验收前创建迁移数据。

