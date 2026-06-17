# D1 迁移指南

开发 D1：

```bash
npm run cms:migrate:preview
```

本地 dry-run 迁移报告：

```bash
npm run cms:seed
```

脚本会生成 `data/cms-migration-report.json`，列出准备迁移的商品、跳过项和需要人工确认的内容。

正式生产迁移必须在 Preview 验收后进行，不得直接写生产数据。

