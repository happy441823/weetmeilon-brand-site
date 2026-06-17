# 备份与恢复

后台导出接口：

```text
GET /api/admin/backup
```

该 JSON 备份包含 CMS 业务表、关系表、revision、管理员角色、媒体引用、发布任务和操作日志。它不包含 R2 对象本体，因此备份包会标记：

```json
{
  "includesR2Objects": false,
  "r2BackupRequired": true
}
```

R2 必须单独通过 Cloudflare 控制台、Wrangler 或对象存储同步工具导出。

本地文件备份命令：

```bash
npm run cms:backup
```

恢复生产数据前必须：

1. 先恢复到开发 D1。
2. 使用 `buildRestorePreview` 或等价脚本检查表数量。
3. 检查商品、文章、FAQ、页面、媒体引用、发布任务和操作日志。
4. 管理员人工确认。
5. 单独恢复 R2 对象。
6. 再执行生产恢复。

后台不会提供无确认的一键清空数据库功能。
