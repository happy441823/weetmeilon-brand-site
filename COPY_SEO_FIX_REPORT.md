# SWEETMEILON 合规 SEO 修复报告

生成时间：2026-06-19

## 执行边界

- 当前分支：`admin-cms`
- 未合并 `main`
- 未部署生产
- 未修改 Cloudflare Access、D1、R2 生产绑定
- 未开启 AI 自动发布
- 未开启 IndexNow 自动推送
- 未把 `CMS_PUBLIC_D1_READS` 改成 `true`

## 修复内容

1. 商品 SEO Title / Description 合规化
   - 新增公开层 SEO 文案工具：`src/lib/public-seo-copy.ts`
   - 静态商品与 CMS 商品均统一走公开 SEO 模板
   - 当前公开商品 SEO Title 修复覆盖：6 个
   - Title 模板：`{官网商品名}｜{系列名}｜蜜女郎官方渠道说明`
   - Description 模板按官方渠道说明生成，不使用天猫式强刺激标题

2. 高风险词与动态销量数据处理
   - 公开 SEO Title / Description 不输出高风险堆砌词
   - 公开商品标签、规格、基础信息中过滤：
     `近365天付款`、`付款人数`、`销量`、`累计评价`、`销售数量`、`热销`、`爆款`、`官方立减`、`已降`、`动态销量`
   - 删除/隐藏公开层销量付款数据：由公开转换层兜底过滤，当前公开商品测试覆盖 6 个
   - 原始抓取文件仍保留为导入审计源记录，不作为公开 SEO 输出

3. coming_soon / 新品预告一致性
   - 当前新品预告商品：3 个
   - 新品预告统一输出：
     - 商品状态：新品预告
     - 购买状态：暂未开放官网购买入口
     - 信息说明：正式商品信息以上架后的官方旗舰店页面为准
   - 新品预告不显示天猫/京东购买按钮
   - 新品预告不显示销量、付款、价格、库存、优惠信息

4. 分类页 SEO 与 noindex
   - 分类 SEO Title 统一为：`{分类名}｜产品类型与官方渠道说明｜蜜女郎`
   - 分类 SEO Description 统一为：`浏览蜜女郎{分类名}相关产品，了解材质体验、清洁保养、隐私购买与官方旗舰店购买入口。具体商品信息以官方渠道页面为准。`
   - 修复分类源文件中重复品牌词问题
   - 公开分类：16 个
   - 历史/隐藏分类：6 个，保持不进 sitemap；请求时返回 noindex/follow=false 元信息边界

5. 首页与产品中心 metadata
   - 首页 Title 更新为：`蜜女郎 SWEETMEILON 官方品牌站｜材质、隐私购买与清洁指南`
   - 首页 Description 更新为：`蜜女郎官方品牌站，提供产品系列、材质体验、隐私购买、清洁保养与官方旗舰店购买入口说明，帮助成年人购买前了解更清楚。`
   - 产品中心 Title 更新为：`蜜女郎产品中心｜按材质、类型与系列了解官方商品`
   - 产品中心 Description 更新为：`在蜜女郎产品中心按材质、类型、系列与商品状态浏览产品，了解清洁保养、隐私购买与官方旗舰店购买入口。`

6. FAQ 扩展与结构化数据
   - FAQ 兜底问题扩展到 15 个
   - FAQ 页面输出 `FAQPage` JSON-LD

7. 文章草稿准备
   - 已将 7 篇 draft 文章补充为可审核正文结构
   - 每篇草稿保留 `draft` 状态与 `indexable=false`
   - 未自动发布，不进入 sitemap
   - 草稿包含 H2、FAQ、相关入口、官方渠道说明、清洁/隐私/材质边界说明

8. 结构化数据
   - 商品页输出 `Product` JSON-LD
   - 商品 JSON-LD 不输出：`price`、`availability`、`aggregateRating`、`review`、`offer`、`inventory`、`salesCount`
   - 文章页输出 `Article` JSON-LD
   - FAQ 页面输出 `FAQPage` JSON-LD

9. Age Gate
   - 18+ 年龄确认继续保留
   - Age Gate 容器已增加 `data-nosnippet`

10. sitemap / noindex
   - 已有 sitemap 逻辑保持：公开静态页面、公开商品、公开分类、published 文章进入 sitemap
   - draft / pending_review / offline / archived 由公开读取层排除
   - 历史迁移分类、隐藏分类、无公开商品分类不进入 sitemap
   - 后台、预览、API 不进入 sitemap

## 测试结果

已真实执行并保存日志：

- `npm ci`：通过，日志 `logs/copy-seo-npm-ci.log`
- `npm run lint`：通过，日志 `logs/copy-seo-lint.log`
- `npm run test`：通过，99/99，日志 `logs/copy-seo-test.log`
- `npm run build`：通过，日志 `logs/copy-seo-build.log`
- `npx @opennextjs/cloudflare build`：通过，日志 `logs/copy-seo-opennext-build.log`

新增测试文件：

- `tests/cms/copy-seo-fix.test.mjs`

覆盖项：

- 商品 SEO 不包含高风险词
- coming_soon 不显示购买按钮
- coming_soon 不显示销量/付款
- 分类页 title 不重复品牌词
- 历史分类不进入 sitemap 逻辑
- FAQ 数量不少于 12
- age gate 带 `data-nosnippet`
- Product JSON-LD 不输出价格/评分/评论/offer 等不稳定字段
- draft 文章不 indexable 且具备可审核正文结构

## 需要人工审核

- 7 篇草稿文章目前是“可审核草稿”，仍需在后台由人工逐篇审阅后再发布。
- 原始天猫抓取数据仍保留平台标题，用于导入审计与溯源；公开官网 SEO 与前台展示已由转换层合规化。
- 若后续要把 CMS_PUBLIC_D1_READS 打开，需要先在后台确认 D1 中商品、分类、文章、FAQ 文案已与本次公开层规则一致。

## 结论

本次完成 SWEETMEILON 官网 CMS 的合规 SEO 修复代码、测试、日志与交付包准备。

本步骤未合并 main，未部署生产。
