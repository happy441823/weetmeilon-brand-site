# SWEETMEILON 商品导入与 AI SEO 插件架构

## 范围

本插件运行在现有 Next.js + OpenNext + Cloudflare Workers CMS 中，后台路径受 Cloudflare Access 保护。

第一阶段只上线插件界面、基础导入任务、合规 URL 解析、SEO/AI 草稿任务和推送日志记录。

默认不启用：

- AI 自动生成
- AI 自动发布
- IndexNow 自动推送
- 正式前台 D1 读取

## 新增后台页面

- `/admin/imports`：导入任务列表
- `/admin/imports/new`：商品链接 / 批量 URL / CSV 导入预览
- `/admin/imports/jobs`：导入任务队列
- `/admin/seo/articles/generate`：AI/SEO 文章草稿任务
- `/admin/seo/push`：搜索引擎待提交 URL 记录
- `/admin/seo/indexing`：SEO 推送日志

## 新增 API

- `POST /api/admin/imports/preview`
- `POST /api/admin/imports/jobs`
- `POST /api/admin/imports/jobs/:id/apply`
- `POST /api/admin/seo/articles/generate`
- `POST /api/admin/seo/push`

## 新增 D1 表

- `import_jobs`
- `imported_product_sources`
- `imported_media_sources`
- `seo_generation_jobs`
- `seo_push_logs`

所有新增表已纳入 CMS 备份清单。

## 合规实现

导入解析只允许：

- 解析 URL 中的商品 ID
- 读取公开 meta / Open Graph / JSON-LD
- 读取运营手动填写字段
- 读取 CSV 中的商品链接和图片 URL

禁止：

- Cookie
- 登录态抓取
- 私有接口
- 逆向接口
- headless browser 模拟用户行为
- 高频抓取
- 竞品详情页素材导入

## 发布边界

导入任务 apply 后最多创建或更新 `draft` 商品和商品来源绑定。

AI/SEO 生成接口当前只保存 `seo_generation_jobs.status=draft`，不调用外部 AI，不写入正式文章表，不发布到前台。

SEO 推送接口当前只记录日志。`CMS_SEO_AUTO_SUBMIT=false` 时不会推送 IndexNow。
