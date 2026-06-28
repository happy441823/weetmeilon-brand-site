# SWEETMEILON 文章第二轮优化报告

生成时间：2026-06-28T03:47:55.359Z

## 写入结果

- 是否执行正式写入：是
- 目标数据库：sweetmeilon-cms-prod
- 优化文章数量：5
- 实际修改字段：title、excerpt、body_html、seo_title、seo_description、canonical_url、keywords_json、toc_json、updated_at
- 是否修改 status：否
- 是否修改 indexable：否
- 是否修改商品数据：否
- 是否修改 Cloudflare 配置：否
- 是否部署生产：否

## Wrangler 输出

```text
⛅️ wrangler 4.100.0 (update available 4.105.0)
───────────────────────────────────────────────
Resource location: remote 

🌀 Executing on remote database sweetmeilon-cms-prod (6d3134fc-4a46-4c49-9f22-f18a06ba30a5):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
Note: if the execution fails to complete, your DB will return to its original state and you can safely retry.
├ Checking if file needs uploading
│
├ 🌀 Uploading 6d3134fc-4a46-4c49-9f22-f18a06ba30a5.66081e39e0639992.sql
│ 🌀 Uploading complete.
│
🌀 Starting import...
🌀 Processed 5 queries.
🚣 Executed 5 queries in 7.76ms (5 rows read, 5 rows written)
   Database is currently at bookmark 000008ef-0000000e-00005098-6509604414301f855a70b6e2b50a21c2.
[
  {
    "results": [
      {
        "Total queries executed": 5,
        "Rows read": 5,
        "Rows written": 5,
        "Database size (MB)": "1.01"
      }
    ],
    "success": true,
    "finalBookmark": "000008ef-0000000e-00005098-6509604414301f855a70b6e2b50a21c2",
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_colo": "LAX",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 7.7643
      },
      "duration": 7.7643,
      "changes": 6,
      "last_row_id": 0,
      "changed_db": true,
      "size_after": 1007616,
      "rows_read": 5,
      "rows_written": 5,
      "num_tables": 37,
      "total_attempts": 1
    }
  }
]
```

## D1 复核

- cleaning-and-storage-guide：status=published，indexable=1，body_len=1016，风险词=0
- how-to-choose-cup-products：status=published，indexable=1，body_len=1038，风险词=0
- mold-products-care-guide：status=published，indexable=1，body_len=901，风险词=0
- privacy-shipping-guide：status=published，indexable=1，body_len=1002，风险词=0
- tpe-vs-silicone-material-guide：status=published，indexable=1，body_len=1252，风险词=0

## 内容质量检查

- 每篇包含官方渠道说明：是
- 每篇包含 18+ 内容边界说明：是
- 每篇包含 FAQ 2-4 个：是
- 每篇包含相关内链：是
- 强刺激词扫描：0
- 动态交易词扫描：0
- 医疗/绝对化词扫描：0
- 原生肌凝硅误用：0

## 下一步

- 可以进行前台 5 篇文章 URL 抽检。
- 抽检通过后，可把本轮 SQL 与报告归档提交。
