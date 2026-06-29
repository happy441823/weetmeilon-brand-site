# ARTICLE ROUND2 CMS PUBLISH REPORT

Generated at: 2026-06-29T18:39:09.5664917+08:00
Database: sweetmeilon-cms-prod

## 发布结果

已将第二批 5 篇文章从 CMS 草稿发布为 published，并设置 indexable=1。

- official-site-to-tmall
- material-photo-checklist
- beginner-buying-questions
- product-info-before-buying
- weekly-care-routine

## D1 验证

```json
[
  {
    "results": [
      {
        "slug": "official-site-to-tmall",
        "title": "官网和官方旗舰店分别看什么？购买前先分清品牌说明与下单信息",
        "status": "published",
        "indexable": 1,
        "published_at": "2026-06-29T10:37:42.939Z"
      },
      {
        "slug": "material-photo-checklist",
        "title": "看产品图时先看哪些细节？从轮廓、表面、边缘和收纳条件开始",
        "status": "published",
        "indexable": 1,
        "published_at": "2026-06-29T10:37:42.939Z"
      },
      {
        "slug": "beginner-buying-questions",
        "title": "第一次购买前建议先确认什么？材质、尺寸、隐私和护理清单",
        "status": "published",
        "indexable": 1,
        "published_at": "2026-06-29T10:37:42.939Z"
      },
      {
        "slug": "product-info-before-buying",
        "title": "商品信息里哪些内容最值得确认？规格、材质、包装和售后说明",
        "status": "published",
        "indexable": 1,
        "published_at": "2026-06-29T10:37:42.939Z"
      },
      {
        "slug": "weekly-care-routine",
        "title": "日常维护清单：清洁、晾干、单独收纳和定期检查",
        "status": "published",
        "indexable": 1,
        "published_at": "2026-06-29T10:37:42.939Z"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_colo": "LAX",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.4503
      },
      "duration": 0.4503,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1040384,
      "rows_read": 15,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
```

## 线上 URL 验证

200 https://sweetmeilon.com/articles/official-site-to-tmall
200 https://sweetmeilon.com/articles/material-photo-checklist
200 https://sweetmeilon.com/articles/beginner-buying-questions
200 https://sweetmeilon.com/articles/product-info-before-buying
200 https://sweetmeilon.com/articles/weekly-care-routine
200 https://sweetmeilon.com/sitemap.xml

## sitemap / 页面安全扫描

- official-site-to-tmall：sitemap=True; noindex=False; risk=False
- material-photo-checklist：sitemap=True; noindex=False; risk=False
- beginner-buying-questions：sitemap=True; noindex=False; risk=False
- product-info-before-buying：sitemap=True; noindex=False; risk=False
- weekly-care-routine：sitemap=True; noindex=False; risk=False

## 边界确认

- 修改生产 D1：是，仅修改上述 5 篇文章。
- 修改商品数据：否。
- 修改 Cloudflare 配置：否。
- 触发生产部署：否。
- 合并 main：否。
- 开启 IndexNow 自动提交：否。
- 强刺激词 / 动态交易词 / 医疗绝对化词扫描：通过。

## 下一步

可以把这 5 个 URL 提交到百度、头条等站长平台；也可以等待搜索引擎按 sitemap 自然抓取。
