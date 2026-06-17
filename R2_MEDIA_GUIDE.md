# R2 媒体规则

建议目录：

```text
products/YYYY-MM-DD/
articles/YYYY-MM-DD/
brand/YYYY-MM-DD/
og/YYYY-MM-DD/
downloads/YYYY-MM-DD/
```

后台上传接口会生成随机文件名前缀，避免覆盖。公开访问 URL 建议通过自定义域名或 Cloudflare R2 public base URL 统一配置到 `site_settings` 的 `cms.media_public_base_url`。

