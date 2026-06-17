# Cloudflare Access 设置

在 Cloudflare 控制台执行：

1. 打开 Zero Trust。
2. 进入 Access -> Applications。
3. 点击 Add an application。
4. 选择 Self-hosted。
5. 名称填写：`SWEETMEILON CMS Preview`。
6. Application domain 填写 Preview 域名。
7. Path 分别添加：
   - `/admin`
   - `/admin/*`
   - `/api/admin/*`
8. Policy 选择 Allow。
9. Include 选择 Emails，填写允许访问的管理员邮箱。
10. 保存。

生产环境验收后，再为 `sweetmeilon.com/admin/*` 和 `sweetmeilon.com/api/admin/*` 创建同样规则。

