# SWEETMEILON 商品文案公开层 PR 准备检查

生成时间：2026-06-20

本次只做提交状态修复与 PR 准备。未继续修改商品文案数据，未部署生产，未合并 main。

## 一、Git 状态

| 项目 | 结果 |
| --- | --- |
| 当前分支 | `admin-cms` |
| 最新本地 commit SHA | `9ae73c288c8d9b8476d05572a36069ca8033ea7b` |
| 最新提交信息 | `fix: sanitize product metadata and jsonld descriptions` |
| 是否已 push 到 `origin/admin-cms` | 是 |
| 当前工作区是否干净 | 否 |

说明：

- 本地已完成公开层 metadata / JSON-LD 修复提交。
- `origin/admin-cms` 已确认指向 `9ae73c288c8d9b8476d05572a36069ca8033ea7b`。
- 推送过程中曾出现 GitHub 443 连接失败日志，但最终远程跟踪分支已同步到最新提交。
- 工作区仍有本轮之外的未提交 / 未跟踪文件，未纳入本次 PR 准备提交。

## 二、已确认文件

本次检查并提交的核心文件：

- `src/app/products/[slug]/page.tsx`
- `src/lib/public-seo-copy.ts`
- `tests/cms/product-public-metadata-jsonld.test.mjs`
- `PRODUCT_COPY_PUBLIC_METADATA_JSONLD_FIX_REPORT.md`
- `PRODUCT_COPY_ALL_PRODUCTS_FINAL_FRONTEND_CHECK_V2.md`

本报告生成后将并入同一修复提交。

## 三、公开层模板确认

商品详情页 metadata description 与 Product JSON-LD description 不再直接使用 D1 中的 `seoDescription`，统一通过 `publicProductSeoDescription()` 生成。

已上架商品安全模板：

```text
了解{商品名}的产品类型、材质体验、清洁收纳与隐私购买说明。具体规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。
```

coming_soon 商品安全模板：

```text
了解{商品名}的新品预告、材质体验方向、清洁保养与隐私购买说明。正式商品信息以上架后的蜜女郎官方旗舰店页面为准。
```

已确认不再使用以下旧动态交易词作为公开层 metadata / JSON-LD description 模板：

- `价格`
- `库存`
- `优惠`
- `付款人数`
- `销量`
- `近365天付款`
- `实时价格`

## 四、命令检查

| 命令 | 结果 |
| --- | --- |
| `npm run lint` | 通过 |
| `npm run test` | 通过，119/119 |
| `npm run build` | 通过 |
| `npx @opennextjs/cloudflare build` | 通过 |

## 五、安全边界

| 项目 | 结果 |
| --- | --- |
| 是否修改生产 D1 | 否 |
| 是否修改 Cloudflare 配置 | 否 |
| 是否部署生产 | 否 |
| 是否合并 main | 否 |
| 是否开启 `CMS_PUBLIC_D1_READS` | 否 |
| 是否开启 AI 自动发布 | 否 |
| 是否开启 IndexNow 自动推送 | 否 |

## 六、PR 判断

是否可以创建 PR：可以创建 PR，但需注意工作区仍有未提交的本轮之外文件。

判断：

1. 公开层 metadata / JSON-LD 修复提交已经完成。
2. `origin/admin-cms` 已同步到最新修复提交。
3. `lint / test / build / OpenNext build` 全部通过。
4. 当前工作区仍有本轮之外的未提交 / 未跟踪文件；创建 PR 前应确认 GitHub 页面中的 PR diff 只包含需要进入 main 的提交范围。

创建 PR 前可重新确认：

```text
git status
git log --oneline -3
```

若 PR diff 只包含本次公开层 metadata / JSON-LD 修复范围，则可以创建 PR：`admin-cms -> main`。
