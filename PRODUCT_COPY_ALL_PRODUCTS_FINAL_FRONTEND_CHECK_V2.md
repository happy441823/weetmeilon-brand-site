# SWEETMEILON 全量商品文案最终前台验收 V2

生成时间：2026-06-20

本次基于 `PRODUCT_COPY_PUBLIC_METADATA_JSONLD_FIX_REPORT.md` 重新执行全量商品文案最终前台验收。  
本次仅检查，未修改生产 D1 数据，未修改 Cloudflare 配置，未部署生产，未合并 main。

## 一、验收结论

结论：未完全通过。

原因：

- 生产 D1 中 30 个已修复商品的数据扫描通过。
- 本地公开层源码和构建产物中，商品详情 metadata / JSON-LD 的旧动态交易词模板已清理。
- 但线上生产页面仍有旧部署残留，部分商品详情页的 `metadata description` 与 `Product JSON-LD description` 仍包含 `价格 / 库存 / 优惠`。

因此当前不建议创建 `admin-cms -> main` PR，也不建议继续部署下一阶段，需先确认线上部署版本是否包含 `PRODUCT_COPY_PUBLIC_METADATA_JSONLD_FIX_REPORT.md` 对应修复。

## 二、Git 状态

- 当前分支：`admin-cms`
- 最新 commit SHA：`2455d71d74a8bbd271ce09e203549c58003d4020`
- `origin/admin-cms` 同步状态：已配置跟踪分支，当前提交历史未显示 ahead/behind
- 当前工作区是否干净：否
- 是否已 push 到 `origin/admin-cms`：当前提交历史看起来已同步，但本地仍有未提交 / 未跟踪文件，因此当前工作区内容未完全 push

当前工作区存在未提交内容，包括报告、脚本、测试和若干源码改动；本次未执行 commit / push。

## 三、命令检查

| 命令 | 结果 |
|---|---|
| `npm run lint` | 通过 |
| `npm run test` | 通过，119/119 |
| `npm run build` | 通过 |
| `npx @opennextjs/cloudflare build` | 通过 |

OpenNext 构建提示 Windows 兼容性警告，非阻断错误。

## 四、生产 D1 数据扫描

检查 30 个已修复商品：

| 项目 | 结果 |
|---|---:|
| 露骨词剩余数量 | 0 |
| 动态词剩余数量 | 0 |
| 医疗 / 绝对化词剩余数量 | 0 |
| 原生肌凝硅误用数量 | 0 |
| `product_images.alt_text` 风险词数量 | 0 |

生产 D1 数据层通过。

## 五、重点商品状态确认

### `tmall-864339322176`

- slug：`hip-864339322176`
- status：`coming_soon`
- buy_button_enabled：`0`
- tmall_enabled：`0`
- jd_enabled：`0`
- 天猫链接：未启用
- 京东链接：未启用
- 购买按钮规则：通过
- 生产 D1 文案未暗示当前可购买

线上页面 metadata / JSON-LD 未发现 `价格 / 库存 / 优惠`，但页面 HTML 中仍命中 `价格 / 库存`，需要后续确认是否来自非商品文案区域或旧静态片段。

### `tmall-997868122989`

- slug：`hip-automatic-997868122989`
- status：`published`
- buy_button_enabled：`1`
- 未出现：`硅胶自动臀部体验款`
- 未出现：`硅胶柔感方向`
- 未出现：`原生肌凝硅`
- 未出现：`凝硅`

生产 D1 数据层通过；线上 metadata / JSON-LD 仍有旧动态词残留。

## 六、前台 URL 抽检

| URL | HTTP | 页面结果 | metadata description | Product JSON-LD | 结论 |
|---|---:|---|---|---|---|
| `https://sweetmeilon.com/products` | 200 | 可访问 | 未发现风险词 | 不适用 | 通过 |
| `https://sweetmeilon.com/products/half-body-lower-body-leg-mold-900451599013` | 200 | 可访问 | 仍含 `价格 / 库存 / 优惠` | description 仍含 `价格 / 库存 / 优惠` | 不通过 |
| `https://sweetmeilon.com/products/hip-864339322176` | 200 | 可访问 | 未发现 `价格 / 库存 / 优惠` | 未发现 `价格 / 库存 / 优惠` | 条件通过 |
| `https://sweetmeilon.com/products/hip-automatic-997868122989` | 200 | 可访问 | 仍含 `价格 / 库存 / 优惠` | description 仍含 `价格 / 库存 / 优惠` | 不通过 |
| `https://sweetmeilon.com/products/half-body-silicone-932717912766` | 200 | 可访问 | 仍含 `价格 / 库存 / 优惠` | description 仍含 `价格 / 库存 / 优惠` | 不通过 |
| `https://sweetmeilon.com/products/hip-silicone-1008749329121` | 200 | 可访问 | 仍含 `价格 / 库存 / 优惠` | description 仍含 `价格 / 库存 / 优惠` | 不通过 |
| `https://sweetmeilon.com/products/hip-automatic-silicone-1046323454771` | 200 | 可访问 | 仍含 `价格 / 库存 / 优惠` | description 仍含 `价格 / 库存 / 优惠` | 不通过 |
| `https://sweetmeilon.com/sitemap.xml` | 200 | 可访问 | 不适用 | 不适用 | 通过 |

## 七、SEO Title / Description 检查

生产 D1 商品 SEO 字段扫描通过：

- SEO Title 未发现露骨词。
- SEO Description 未发现露骨词。
- SEO Title / Description 未发现医疗、功效、绝对化承诺。
- SEO Title / Description 未发现原生肌凝硅误用。

线上生产页面未完全通过：

- 多个商品详情页仍输出旧 `metadata description`，包含 `价格 / 库存 / 优惠`。
- 该问题更像线上部署版本未更新或缓存残留，而不是生产 D1 数据问题。

## 八、Product JSON-LD 检查

规则要求：

- 不输出 `offers`
- 不输出 `price`
- 不输出 `availability`
- 不输出 `aggregateRating`
- 不输出 `review`
- 不输出 `salesCount`
- `description` 不含 `价格 / 库存 / 优惠`

检查结果：

- 未发现 `offers / price / availability / aggregateRating / review / salesCount` 字段输出。
- 但多个线上商品页的 Product JSON-LD `description` 仍包含 `价格 / 库存 / 优惠`。

Product JSON-LD 字段结构通过，description 文案未通过。

## 九、sitemap 检查

`https://sweetmeilon.com/sitemap.xml` 可访问。

未发现以下错误路径：

- `draft`
- `history`
- `legacy`
- `half-body-public-review`

sitemap 检查通过。

## 十、图片 alt 检查

生产 D1 `product_images.alt_text` 扫描结果：

- 露骨词：0
- 动态词：0
- 医疗 / 绝对化词：0
- 原生肌凝硅误用：0

图片 alt 检查通过。

## 十一、fallback 文案检查

本地公开层 fallback / overrides 文件已检查。

结果：

- 未发现旧天猫式强刺激标题继续作为公开层输出模板。
- 未发现白名单外 `tmall-*` 商品使用 `原生肌凝硅 / 凝硅 / Native Skin Silicone / native-skin-silicone`。
- 本地构建产物中商品详情旧动态交易词模板未命中。

fallback 检查通过。

## 十二、原生肌凝硅白名单规则

允许范围：

- `native-skin-silicone-soft`
- `texture-detail-series`
- `privacy-starter-kit`
- `/material`
- 相关说明文章

检查结果：

- 生产 D1 中 30 个 `tmall-*` 商品未发现 `原生肌凝硅 / 凝硅 / Native Skin Silicone / native-skin-silicone`。
- 线上 `/products` 与 sitemap 中出现的 `native-skin-silicone` 命中来自白名单新品或相关文章路径，未发现白名单外误用。

白名单规则通过。

## 十三、coming_soon 购买按钮规则

重点商品：`tmall-864339322176`

- status：`coming_soon`
- buy_button_enabled：`0`
- tmall_enabled：`0`
- jd_enabled：`0`
- 不显示天猫 / 京东购买按钮：通过
- 不输出 `offers / price / availability`：通过

coming_soon 购买按钮规则通过。

## 十四、残留问题

仍有残留。

残留类型：

- 线上商品详情页 `metadata description` 含 `价格 / 库存 / 优惠`
- 线上商品详情页 `Product JSON-LD description` 含 `价格 / 库存 / 优惠`

残留 URL：

- `https://sweetmeilon.com/products/half-body-lower-body-leg-mold-900451599013`
- `https://sweetmeilon.com/products/hip-automatic-997868122989`
- `https://sweetmeilon.com/products/half-body-silicone-932717912766`
- `https://sweetmeilon.com/products/hip-silicone-1008749329121`
- `https://sweetmeilon.com/products/hip-automatic-silicone-1046323454771`

说明：

- 生产 D1 数据层已通过。
- 本地源码和构建产物未再命中旧模板。
- 线上仍有残留，优先判断为生产站尚未部署包含修复的最新代码，或存在边缘缓存 / 旧构建缓存。

## 十五、是否可以创建 PR

是否可以创建 PR：暂不建议。

原因：

- 本次最终前台验收 V2 未完全通过。
- 当前工作区不干净。
- 当前报告及部分本地变更尚未提交。
- 线上生产详情页仍有旧 metadata / JSON-LD 文案残留。

建议下一步：

1. 确认 `PRODUCT_COPY_PUBLIC_METADATA_JSONLD_FIX_REPORT.md` 对应代码是否已 commit 并 push。
2. 确认生产部署是否使用最新 main。
3. 重新部署后清理 Cloudflare 缓存，再复测上述不通过 URL。
4. 复测通过后再创建或更新 `admin-cms -> main` PR。

## 十六、最终状态

- 是否完全通过：否
- 是否还有残留：是，线上 metadata / JSON-LD description 残留 `价格 / 库存 / 优惠`
- 最新 commit SHA：`2455d71d74a8bbd271ce09e203549c58003d4020`
- 当前工作区是否干净：否
- 是否已 push 到 `origin/admin-cms`：提交历史看起来已同步，但当前工作区仍有未提交内容，不能视为当前验收状态已完全 push
- 是否可以创建 PR：admin-cms → main：暂不建议

