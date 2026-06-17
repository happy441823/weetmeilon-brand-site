# 安全检查

已实现：

- 后台 API 统一读取 Cloudflare Access 邮箱头。
- D1 保存管理员与角色。
- 服务端角色校验。
- 审计日志。
- R2 上传类型和 SVG 脚本检查。
- 后台与后台 API 返回 `x-robots-tag: noindex, nofollow`。
- 禁止 `javascript:` 和 `data:` 导航/重定向链接。

需要控制台完成：

- 为 Preview 和生产分别配置 Cloudflare Access。
- 创建独立开发 D1/R2。
- 验收后再创建生产 D1/R2。

