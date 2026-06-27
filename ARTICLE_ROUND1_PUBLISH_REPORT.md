# SWEETMEILON 第一轮文章发布报告

生成时间：2026-06-27

## 发布范围

本次发布 4 篇第一轮内容优化文章：

| slug | 状态 | indexable |
| --- | --- | --- |
| `tpe-vs-silicone-material-guide` | published | true |
| `cleaning-and-storage-guide` | published | true |
| `how-to-choose-cup-products` | published | true |
| `mold-products-care-guide` | published | true |

既有文章 `privacy-shipping-guide` 未在本次发布中修改。

## D1 写入

- 数据库：`sweetmeilon-cms-prod`
- 写入方式：安全条件更新，仅将上述 4 篇从 `draft/indexable=false` 改为 `published/indexable=true`
- SQL 文件：`ARTICLE_ROUND1_DRAFT_PUBLISH.sql`
- 未修改商品数据
- 未修改 Cloudflare Access
- 未修改 R2 绑定
- 未开启 IndexNow
- 未开启 AI 自动发布

## 公开读取配置

生产环境保持：

```text
CMS_PUBLIC_D1_READS=false
CMS_PUBLIC_PRODUCTS_D1_READS=true
CMS_PUBLIC_ARTICLES_D1_READS=true
```

说明：只为文章公开页开启文章资源 D1 读取，不开启全局公开 D1 读取。

## 构建检查

| 命令 | 结果 |
| --- | --- |
| `npm run lint` | 通过 |
| `npm run test` | 通过，142/142 |
| `npm run build` | 通过 |
| `npx @opennextjs/cloudflare build` | 通过 |
| `npx wrangler deploy` | 通过 |

部署版本：

```text
780d5e9c-5752-4d3f-84e7-55595d570497
```

## 前台复测

| URL | 结果 |
| --- | --- |
| `https://sweetmeilon.com/articles` | 200 |
| `https://sweetmeilon.com/articles/tpe-vs-silicone-material-guide` | 200 |
| `https://sweetmeilon.com/articles/cleaning-and-storage-guide` | 200 |
| `https://sweetmeilon.com/articles/how-to-choose-cup-products` | 200 |
| `https://sweetmeilon.com/articles/mold-products-care-guide` | 200 |
| `https://sweetmeilon.com/sitemap.xml` | 200 |

## Sitemap 检查

以下 4 篇均已进入 sitemap：

- `tpe-vs-silicone-material-guide`
- `cleaning-and-storage-guide`
- `how-to-choose-cup-products`
- `mold-products-care-guide`

页面未检测到 `noindex`。

## 结论

第一轮 4 篇文章已发布并可被公开访问，sitemap 已同步收录入口。生产商品数据、后台权限、Cloudflare Access、D1/R2 绑定均未被修改。
