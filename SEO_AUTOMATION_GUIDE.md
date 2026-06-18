# SWEETMEILON SEO 自动化说明

## 当前状态

SEO 自动化在第一阶段默认关闭。

```text
CMS_SEO_AUTO_SUBMIT=false
CMS_SEO_INDEXNOW_ENABLE=false
```

后台可记录待提交 URL，但不会自动推送搜索引擎。

## 已支持

- SEO/AI 生成任务记录
- 搜索引擎推送日志
- Google / Baidu / Bing 手动清单 provider
- IndexNow provider 占位

## 结构化数据边界

Product JSON-LD 只能使用真实存在的数据。

没有真实价格、库存、评分、评价时，不得输出：

- `price`
- `availability`
- `aggregateRating`
- `review`

## Sitemap 边界

第一阶段不改变正式前台读取策略。

正式前台继续使用现有稳定 sitemap / robots 行为，CMS 内容只有在后续开启前台 D1 读取后才进入公开索引链路。
