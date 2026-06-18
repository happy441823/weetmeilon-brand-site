# CMS 测试报告

当前状态：CMS 代码、D1 migration、后台页面、API、迁移脚本、备份脚本和中文文档已完成第一版。尚未获得真实 Cloudflare Preview 地址。

已执行测试命令：

```bash
npm ci
npm run test
npm run lint
npm run build
npx @opennextjs/cloudflare build
```

结果：

- `npm ci`：通过。提示 8 个依赖审计问题，暂未执行会改变依赖范围的 `npm audit fix --force`。
- `npm run test`：通过，3 个 CMS 单元测试全部通过。
- `npm run lint`：通过。
- `npm run build`：通过，Next.js 生成 40 个路由。
- `npx @opennextjs/cloudflare build`：通过，生成 `.open-next/worker.js`。OpenNext 在 Windows 下输出兼容性警告，建议正式 CI 使用 Linux/WSL。
- `npm run cms:seed`：通过，生成 `data/cms-migration-report.json`，准备迁移商品 4 个，跳过 0 个。

阻塞项：

- 当前环境没有可调用的 `git`，无法真实创建 `admin-cms` 分支。
- 需要你在 Cloudflare 创建开发 D1、开发 R2，并替换 `wrangler.jsonc` 中的 D1 database_id。
- Preview 地址需要 Cloudflare 部署完成后才能提供。

未执行项：

- 未执行开发 D1 remote migration，因为当前没有 Cloudflare D1 database_id。
- 未执行 R2 上传实测，因为当前没有开发 R2 bucket 绑定。
- 未配置 Cloudflare Access，因为需要控制台权限。
