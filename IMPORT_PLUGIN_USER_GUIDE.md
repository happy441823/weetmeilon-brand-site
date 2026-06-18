# SWEETMEILON 智能导入与 SEO 插件使用说明

## 商品链接导入

打开：

```text
https://sweetmeilon.com/admin/imports/new
```

支持三种输入：

- 单个天猫 / 京东商品链接
- 多行链接，每行一个 URL
- CSV 内容，字段包括 `product_name,tmall_url,jd_url,category,series,status,image_urls,notes,authorized`

操作流程：

1. 粘贴链接或 CSV。
2. 填写商品名称和备注。
3. 勾选“确认授权”。
4. 点击“预览解析”。
5. 确认预览结果无错误后点击“创建导入任务”。
6. 到 `/admin/imports` 查看任务。

未确认授权的资料只能保存草稿任务，不允许入库为正式素材。

## 生成商品草稿

导入任务审核通过后，可通过 `POST /api/admin/imports/jobs/:id/apply` 生成或更新 CMS 商品。

生成结果：

- 新商品默认 `status=draft`
- 不自动发布
- 不覆盖人工编辑过的 SEO 正文
- 记录 `imported_product_sources`
- 写入 `audit_logs`

## AI 文章生成

打开：

```text
https://sweetmeilon.com/admin/seo/articles/generate
```

当前 `CMS_AI_GENERATION_ENABLE=false`，因此只创建 draft 生成任务，不调用外部 AI，不发布正式文章。

## SEO 推送记录

打开：

```text
https://sweetmeilon.com/admin/seo/push
```

当前 `CMS_SEO_AUTO_SUBMIT=false`，提交 URL 只会写入 `seo_push_logs`，状态为 `skipped`，供人工检查。
