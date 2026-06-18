# Cloudflare Access 设置

## 必需应用

在 Cloudflare Zero Trust 控制台执行：

1. 打开 Access -> Applications。
2. 点击 Add an application。
3. 选择 Self-hosted。
4. Preview 应用名称填写 `SWEETMEILON CMS Preview`。
5. Application domain 填写 Preview 域名。
6. Path 分别添加 `/admin`, `/admin/*`, `/api/admin/*`。
7. Policy 选择 Allow。
8. Include 选择 Emails 或管理组，填写允许访问后台的管理员邮箱。
9. 保存后复制 Access application 的 Audience 值，填入 Preview 环境变量 `CF_ACCESS_AUDIENCE`。
10. 设置 `CF_ACCESS_ISSUER=https://<team-name>.cloudflareaccess.com`。
11. 确认 Preview 和 Production 都保持 `CMS_ALLOW_LOCAL_ADMIN=false`。

生产环境验收通过后，再为 `sweetmeilon.com/admin/*` 和 `sweetmeilon.com/api/admin/*` 创建同样规则，并使用生产应用自己的 Audience。

## 服务端验证要求

- 后台服务端只接受 `Cf-Access-Jwt-Assertion` 作为登录凭据。
- 服务端会验证 JWT 签名、issuer、audience、expiration 和 email。
- Preview 和 Production 不信任 `x-admin-email`、`x-authenticated-user-email` 或 `cf-access-authenticated-user-email` 作为登录证明。
- 本地管理员绕过只在 `CMS_ALLOW_LOCAL_ADMIN=true`、`NODE_ENV` 不是 `production`，且请求 URL 为 localhost 或 `127.0.0.1` 时启用。

## workers.dev 保护方案

推荐方案：自定义域名上线后，在 Worker 设置中关闭 Production 的公开 `workers.dev` 路由。

如果 Preview 仍需保留 `workers.dev`，必须创建单独的 Access Application 覆盖：

- `https://*.workers.dev/admin/*`
- `https://*.workers.dev/api/admin/*`

Preview 必须使用 Preview Access audience，不得复用 Production audience。
