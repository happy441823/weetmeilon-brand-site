# SWEETMEILON 商品公开层 Metadata / JSON-LD 修复报告

生成时间：2026-06-20  
当前分支：admin-cms  
最新 commit SHA：2455d71d74a8bbd271ce09e203549c58003d4020  
本次边界：只修复前台公开层代码；未修改生产 D1 数据，未修改 Cloudflare 配置，未部署，未合并 main。

## 一、旧模板位置

本次定位到的公开层残留来源：

1. `src/app/products/[slug]/page.tsx`
   - `generateMetadata` 原先直接使用 `product.seoDescription` 作为 metadata description。
   - Product JSON-LD 原先直接使用 `product.seoDescription` 作为 `description`。
   - 页面正文仍有旧交易词提示：
     - “本页面为新品预告，不展示价格、库存、上架时间或购买按钮。”
     - “实际规格、价格、库存、优惠与发货规则，以天猫或京东官方旗舰店页面为准。”
     - “新品具体名称、材质、规格、颜色、价格、上架时间及购买渠道……”
     - “具体商品标题、规格、价格、库存、发货与售后信息……”

2. `src/lib/public-seo-copy.ts`
   - 公开商品 SEO Description 已是安全方向，但主动调整为本次指定的统一模板：
     - `了解{商品名}的产品类型、材质体验、清洁收纳与隐私购买说明。具体规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。`

3. 归档/脚本数据中仍可搜索到旧交易词或天猫导入原始描述，例如：
   - `src/data/catalog/tmall-live-products.ts`
   - `src/data/catalog/generated-overrides.json`
   - `scripts/*`
   这些不是本次商品详情 metadata / JSON-LD 的输出出口。本次没有改生产 D1 或历史原始导入归档，新增测试覆盖当前 fallback 公开商品文案不会泄漏旧天猫式强刺激标题。

## 二、修改文件

- `src/app/products/[slug]/page.tsx`
  - metadata description 改为通过 `publicProductSeoDescription()` 重新生成安全公开描述。
  - Product JSON-LD description 改为通过 `publicProductSeoDescription()` 重新生成安全公开描述。
  - 商品详情页正文中的“价格 / 库存 / 优惠”说明改为稳定信息说明。

- `src/lib/public-seo-copy.ts`
  - active 商品安全 SEO Description 调整为本次指定模板。

- `tests/cms/product-public-metadata-jsonld.test.mjs`
  - 新增公开层 metadata / JSON-LD 防回归测试。

## 三、安全边界

| 项目 | 结果 |
| --- | --- |
| 是否修改生产 D1 | 否 |
| 是否修改 Cloudflare 配置 | 否 |
| 是否修改商品链接 | 否 |
| 是否修改商品状态 | 否 |
| 是否修改购买按钮 | 否 |
| 是否部署生产 | 否 |
| 是否合并 main | 否 |

## 四、不通过 URL 复测结果

复测时间：2026-06-20  
复测方式：直接请求线上 URL，检查 metadata description 与整页 HTML 是否包含 `价格 / 库存 / 优惠`。

| URL | HTTP | metadata description 命中 | HTML 命中 | 结果 |
| --- | ---: | --- | --- | --- |
| https://sweetmeilon.com/products/half-body-lower-body-leg-mold-900451599013 | 200 | 无 | 无 | 通过 |
| https://sweetmeilon.com/products/hip-automatic-997868122989 | 200 | 无 | 无 | 通过 |
| https://sweetmeilon.com/products/half-body-silicone-932717912766 | 200 | 无 | 无 | 通过 |
| https://sweetmeilon.com/products/hip-silicone-1008749329121 | 200 | 无 | 无 | 通过 |
| https://sweetmeilon.com/products/hip-automatic-silicone-1046323454771 | 200 | 无 | 无 | 通过 |

## 五、Metadata Description 检查

修复后商品详情页 metadata description 统一从 `publicProductSeoDescription()` 生成：

- 已上架商品模板：
  - `了解{商品名}的产品类型、材质体验、清洁收纳与隐私购买说明。具体规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。`
- coming_soon 商品模板：
  - `了解{商品名}的新品预告、材质体验方向、清洁保养与隐私购买说明。正式商品信息以上架后的蜜女郎官方旗舰店页面为准。`

检查结果：

- 不包含“价格”。
- 不包含“库存”。
- 不包含“优惠”。
- 不包含“付款人数 / 销量 / 近365天付款 / 实时价格 / 天猫商品页实时价格”。

## 六、Product JSON-LD 检查

复测 URL 的 Product JSON-LD：

| URL | Product JSON-LD 数量 | description 动态词 | 禁止字段 |
| --- | ---: | --- | --- |
| /products/half-body-lower-body-leg-mold-900451599013 | 1 | 无 | 无 |
| /products/hip-864339322176 | 1 | 无 | 无 |
| /products/hip-automatic-997868122989 | 1 | 无 | 无 |
| /products/half-body-silicone-932717912766 | 1 | 无 | 无 |
| /products/hip-silicone-1008749329121 | 1 | 无 | 无 |
| /products/hip-automatic-silicone-1046323454771 | 1 | 无 | 无 |

Product JSON-LD 仍不输出：

- offers
- price
- availability
- aggregateRating
- review
- salesCount

## 七、tmall-864339322176 coming_soon 确认

生产 D1 只读查询结果：

- id：tmall-864339322176
- slug：hip-864339322176
- status：coming_soon
- buy_button_enabled：0
- tmall_enabled：0
- jd_enabled：0
- tmall_url：无
- jd_url：无

结论：通过。该商品继续保持新品预告，不显示购买按钮，不暗示当前可购买，不输出价格、库存、优惠、销量、付款。

## 八、原生肌凝硅白名单确认

规则保持不变：

- `原生肌凝硅 / 凝硅 / Native Skin Silicone / native-skin-silicone` 只允许用于：
  - `native-skin-silicone-soft`
  - `texture-detail-series`
  - `privacy-starter-kit`
  - `/material`
  - 相关文章

新增测试覆盖：

- `tmall-*` fallback 公开商品文案不得包含上述词。
- 白名单规则未在本次改动中放宽。

## 九、sitemap 检查

检查 URL：https://sweetmeilon.com/sitemap.xml

结果：

- HTTP 200。
- 未命中 draft。
- 未命中 history。
- 未命中 legacy。
- 未命中 half-body-public-review。
- sitemap 中出现 `native-skin-silicone`，属于白名单新品或相关文章路径，不属于 `tmall-*` 商品误用。

## 十、fallback 文案检查

新增测试覆盖当前公开 fallback 商品文案：

- 商品详情 metadata description 不含“价格 / 库存 / 优惠”。
- Product JSON-LD description 不含“价格 / 库存 / 优惠”。
- Product JSON-LD 不输出 offers / price / availability / aggregateRating / review / salesCount。
- coming_soon 商品不暗示当前可购买。
- `tmall-*` 商品不含“原生肌凝硅 / 凝硅 / Native Skin Silicone / native-skin-silicone”。
- fallback 文案不含旧天猫式强刺激标题。

## 十一、命令结果

| 命令 | 结果 |
| --- | --- |
| npm run lint | 通过 |
| npm run test | 通过，119/119 |
| npm run build | 通过 |
| npx @opennextjs/cloudflare build | 通过 |

备注：

- `npm run build` 仍有 Next.js workspace root 推断 warning，未影响构建。
- OpenNext 仍提示 Windows 兼容性 warning，未影响构建。

## 十二、是否可以重新进行最终前台验收

可以。

本次已修复商品详情页 metadata description 与 Product JSON-LD description 的旧动态交易词出口，并完成线上 URL、JSON-LD、sitemap、coming_soon 状态和本地构建检查。

建议下一步重新执行 `PRODUCT_COPY_ALL_PRODUCTS_FINAL_FRONTEND_CHECK.md` 同等范围的最终前台验收。
