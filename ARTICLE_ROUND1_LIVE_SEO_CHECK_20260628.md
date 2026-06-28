# SWEETMEILON 第一轮文章线上 SEO 检查

检查时间：2026-06-28

## 检查范围

| URL | HTTP | sitemap | noindex | canonical |
| --- | --- | --- | --- | --- |
| `https://sweetmeilon.com/articles` | 200 | - | - | - |
| `https://sweetmeilon.com/articles/tpe-vs-silicone-material-guide` | 200 | 已包含 | 否 | 正常 |
| `https://sweetmeilon.com/articles/cleaning-and-storage-guide` | 200 | 已包含 | 否 | 正常 |
| `https://sweetmeilon.com/articles/privacy-shipping-guide` | 200 | 已包含 | 否 | 正常 |
| `https://sweetmeilon.com/articles/how-to-choose-cup-products` | 200 | 已包含 | 否 | 正常 |
| `https://sweetmeilon.com/articles/mold-products-care-guide` | 200 | 已包含 | 否 | 正常 |
| `https://sweetmeilon.com/sitemap.xml` | 200 | - | - | - |
| `https://sweetmeilon.com/robots.txt` | 200 | - | - | - |

## 文章 metadata 抽检

| slug | Title 长度 | Description 长度 | 结果 |
| --- | ---: | ---: | --- |
| `tpe-vs-silicone-material-guide` | 32 | 39 | 正常 |
| `cleaning-and-storage-guide` | 24 | 36 | 正常 |
| `privacy-shipping-guide` | 29 | 30 | 正常 |
| `how-to-choose-cup-products` | 27 | 37 | 正常 |
| `mold-products-care-guide` | 29 | 36 | 正常 |

## 风险词扫描

对 5 篇文章的可见正文执行扫描，以下风险词均未命中：

```text
价格
库存
优惠
付款人数
销量
治疗
医疗级
最强
100%
真人
熟女
可插入
充气娃娃
原生肌凝硅
凝硅
Native Skin Silicone
native-skin-silicone
```

说明：HTML 原始源码中出现的 `100%` 来自样式/布局代码，可见正文扫描未命中。

## 搜索平台验证

首页已检测到：

```html
<meta name="baidu-site-verification" content="codeva-THc1zEwGZb" />
<meta name="bytedance-verification-code" content="LXpI8KB1tpt9T+yi1tIS" />
```

## robots.txt

`robots.txt` 已允许主流搜索引擎抓取公开页面，并阻止后台与接口路径：

- 允许：Googlebot、Bingbot、Baiduspider、Bytespider、ToutiaoSpider、Sogou、360Spider、YisouSpider、DuckDuckBot、Applebot
- 阻止：`/admin/`、`/api/`、`/internal/`、`/not-for-minors`
- Sitemap：`https://sweetmeilon.com/sitemap.xml`

## 结论

第一轮 5 篇文章的线上可访问性、sitemap、canonical、noindex、基础 metadata 和可见正文风险词检查通过。

当前可以进入下一步：

1. 将 5 篇文章链接提交到已验证的搜索平台；
2. 开始第二轮内容优化，优先补充图片 alt、内链和 FAQ 结构；
3. 继续观察 Cloudflare AI Crawl Control 中 Baidu、Bytespider、Bingbot、Googlebot 的抓取成功率。
