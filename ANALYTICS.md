# ANALYTICS.md

## 监控目标

- 官网访问 UV
- 来源渠道：抖音、B站、小红书、百度、直接访问
- 首页点击率
- 产品页浏览
- 跳转官方渠道按钮点击率
- FAQ 浏览
- 文章页浏览
- 天猫旗舰店与京东旗舰店跳转转化辅助判断

## 已预留事件

代码位置：`src/lib/analytics.ts`

- `view_home`
- `click_tmall_button`
- `click_jd_button`
- `click_tmall_product`
- `click_jd_product`
- `click_official_channel_button`
- `view_product`
- `view_product_list`
- `view_products`
- `view_upcoming_product`
- `filter_product_status`
- `filter_product_category`
- `filter_product_series`
- `search_product`
- `click_product_detail`
- `click_upcoming_product_detail`
- `view_new_arrivals_section`
- `view_material_page`
- `view_faq`
- `view_privacy_shipping`
- `click_privacy_shipping`
- `article_read`
- `view_brand`
- `view_guide`
- `view_buy_page`
- `view_contact`

## 事件参数建议

`click_tmall_button` / `click_jd_button`：

- `source`：按钮位置，例如 `home_hero`、`product_detail_final`
- `product_slug`：产品页或产品卡片携带
- `target`：对应官方渠道跳转链接
- `channel`：`tmall` 或 `jd`

`view_product`：

- `product_slug`
- `product_name`
- `product_status`

`click_tmall_product` / `click_jd_product`：

- `source`：按钮位置，例如 `product_card`、`product_detail_hero`
- `product_slug`
- `product_id`
- `target`
- `channel`

`filter_product_status` / `filter_product_category` / `filter_product_series`：

- `status`、`category` 或 `series`

`search_product`：

- `keyword`

`article_read`：

- `article_slug`
- `category`

## 接入方式

GA4：

- 设置 `NEXT_PUBLIC_GA4_ID`。
- 事件会通过 `window.gtag("event", event, params)` 推送。

百度统计：

- 设置 `NEXT_PUBLIC_BAIDU_TONGJI_ID`。
- 事件会通过 `_hmt.push(["_trackEvent", ...])` 推送。

巨量引擎或其他平台：

- 可在 `trackEvent` 中增加对应 SDK 调用。
- 保持事件名不变，避免历史数据断层。

## 渠道识别

建议所有外部投放链接使用 UTM：

```txt
?utm_source=douyin&utm_medium=social&utm_campaign=brand_home
?utm_source=bilibili&utm_medium=video&utm_campaign=material
?utm_source=xiaohongshu&utm_medium=social&utm_campaign=privacy
?utm_source=baidu&utm_medium=organic
```

## 每周报告模板

- 总 UV / PV / 新用户占比
- Top 5 来源渠道
- 首页到官方渠道按钮点击率
- 产品页浏览排行
- 文章页浏览排行
- FAQ 和隐私发货页访问量
- 天猫旗舰店与京东旗舰店跳转次数及来源分布
- 本周问题：跳出率高的页面、点击率低的 CTA、搜索词缺口
- 下周动作：新增文章、调整首页模块、更新产品图、优化按钮位置
