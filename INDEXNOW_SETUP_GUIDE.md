# SWEETMEILON IndexNow 设置说明

## 当前默认

```text
CMS_SEO_INDEXNOW_ENABLE=false
CMS_SEO_AUTO_SUBMIT=false
CMS_SEO_INDEXNOW_KEY=
```

因此第一阶段不会自动向 IndexNow 推送 URL。

## 后续开启前准备

1. 生成 IndexNow key。
2. 在网站根路径提供 key 文件。
3. 在 Cloudflare 环境变量中配置 `CMS_SEO_INDEXNOW_KEY`。
4. 将 `CMS_SEO_INDEXNOW_ENABLE=true`。
5. 将 `CMS_SEO_AUTO_SUBMIT=true`。
6. 先在 Preview 验证推送日志和失败重试。

## 注意

HTTP 200 只代表搜索引擎收到推送，不代表已收录。

不要高频推送，不要推送草稿、预览、后台、未发布或定时未到时内容。
