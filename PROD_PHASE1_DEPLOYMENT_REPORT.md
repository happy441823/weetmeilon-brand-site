# SWEETMEILON CMS 正式上线第一阶段执行前检查报告

生成时间：2026-06-18

## 阶段边界

第一阶段只上线 /admin 后台与 /api/admin/*。
正式前台官网继续使用现有稳定数据。
CMS_PUBLIC_D1_READS=false。
本步骤未合并 main，未部署生产。

## Git 状态

- 当前分支：admin-cms
- 当前 commit SHA：7b456c544930f6990aa001b0e3ee0c329c156fbc
- main 合并状态：未合并 main
- 生产部署状态：未部署生产

## Production 配置

- Production D1 名称：sweetmeilon-cms-prod
- Production D1 database_id：6d3134fc-4a46-4c49-9f22-f18a06ba30a5
- Production R2 bucket：sweetmeilon-cms-media-prod
- Production Access issuer：https://delicate-block-d1f0.cloudflareaccess.com
- Production Access AUD：已写入 wrangler.jsonc
- CMS_ENVIRONMENT：production
- CMS_ALLOW_LOCAL_ADMIN：false
- CMS_PUBLIC_D1_READS：false
- Production 占位值检查：未发现 REPLACE_WITH_PRODUCTION_ACCESS_AUDIENCE、REPLACE_WITH_TEAM_NAME、REPLACE_WITH_PRODUCTION_D1_DATABASE_ID
- Preview 配置：本步骤未修改 preview 配置

## 构建检查

- npm ci：通过，日志见 logs/prod-stage-npm-ci.log
- npm run lint：通过，日志见 logs/prod-stage-lint.log
- npm run test：通过，日志见 logs/prod-stage-test.log
- npm run build：通过，日志见 logs/prod-stage-build.log
- npx @opennextjs/cloudflare build：通过，日志见 logs/prod-stage-opennext-build.log

## D1 Migration

- 执行命令：npx wrangler d1 migrations apply sweetmeilon-cms-prod --remote
- 目标数据库：sweetmeilon-cms-prod
- 执行结果：成功
- Cloudflare 返回：No migrations to apply，说明 0001_admin_cms.sql 和 0002_products_scheduled_status.sql 当前已处于已应用状态
- 日志：logs/prod-d1-migration.log
- 未执行清库、DROP 全库或破坏性数据库操作

## Super Admin 初始化

- 邮箱：qingyuezhu@qq.com
- 目标角色：super_admin
- 执行方式：对 sweetmeilon-cms-prod 执行幂等初始化 SQL，并查询确认角色绑定
- 执行结果：成功
- 验证结果：qingyuezhu@qq.com 已启用，并绑定 super_admin
- 日志：logs/prod-bootstrap-admin.log

## 结论

- production AUD 是否已写入：是
- CMS_PUBLIC_D1_READS 是否为 false：是
- CMS_ALLOW_LOCAL_ADMIN 是否为 false：是
- migration 是否成功：是
- super_admin 是否初始化成功：是
- npm ci / lint / test / build / OpenNext build 是否全部通过：是
- 是否仍存在任何 production 占位：否
- 是否修改了 preview 配置：否
- 是否部署生产：否
- 是否合并 main：否

## 下一步

请在 GitHub Desktop 或 GitHub 网页检查 admin-cms 分支最新提交，然后可以创建 PR：admin-cms → main。合并前请再次确认本阶段仅启用正式后台 CMS，正式前台仍不切换 D1 数据源。
