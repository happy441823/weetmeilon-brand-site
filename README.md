# 蜜女郎品牌官网

这是「蜜女郎」官方品牌站第一版代码。官网用于：

- 品牌介绍：说明官方旗舰店身份、品牌调性、合规边界。
- 产品了解：围绕原生肌凝硅、质感、清洁和隐私发货建立购买前参考。
- 信息查询：回答蜜女郎、原生肌凝硅、隐私发货、清洁保养等常见问题。
- 官方渠道入口：购买按钮提供天猫旗舰店与京东旗舰店两个官方渠道。

## 品牌定位分析

成人用品品牌官网最重要的任务不是刺激下单，而是在用户购买前把关键信息讲清楚。对天猫和京东旗舰店商家来说，独立官网应承担三类价值：

- 展示品牌信息：让用户看到更正式、更完整的品牌说明。
- 回答购买前问题：用户关注品牌、材质、隐私发货和清洁问题时，需要一个可信、克制、官方的解释页面。
- 提供官方购买入口：官网讲清楚为什么选、怎么选、是否官方，购买回到天猫旗舰店或京东旗舰店所在平台。

核心用户：

- 已了解品牌、但还没建立完整信任的成年人。
- 搜索「蜜女郎」「原生肌凝硅」「隐私发货」等关键词的潜在用户。
- 已在天猫看过商品、想确认品牌和清洁/隐私说明的用户。

购买顾虑与官网回答：

- 材质是否真实：用材质页和产品详情页说明材质定位，具体商品信息以天猫旗舰店或京东旗舰店页面展示为准。
- 触感是否高级：用柔软、回弹、细腻表面、微距图片方向表达，不夸张。
- 是否隐私发货：建立隐私发货说明页，实际规则以天猫旗舰店或京东旗舰店页面展示为准。
- 是否容易清洁：建立清洁指南，强调使用前后清洁、晾干、独立收纳。
- 多款产品怎么选：产品系列页按触感、纹理、隐私和入门需求分流。
- 是否官方渠道：全站统一表达「蜜女郎官方品牌站」，购买处明确天猫蜜女郎旗舰店与京东蜜女郎旗舰店。
- 为什么跳转官方渠道：官网负责信任与选择，天猫旗舰店和京东旗舰店负责交易、优惠、物流和售后。

## 购买前了解流程

1. 用户进入官网首页。
2. 首页确认官方身份、核心材质和隐私发货。
3. 进入产品系列页或原生肌凝硅材质页。
4. 查看产品详情、FAQ、清洁指南或隐私发货说明。
5. 点击「前往天猫旗舰店」「前往京东旗舰店」「查看天猫同款」「查看京东同款」。
6. 在天猫旗舰店或京东旗舰店完成下单。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- CSS 轻动画
- lucide-react
- 静态生成与 metadata
- 预留 GA4、百度统计和自定义事件埋点

## 文件结构

```txt
src/
  app/
    page.tsx                    首页
    brand/page.tsx              品牌故事
    products/page.tsx           产品中心
    products/category/[slug]/   商品分类页
    products/[slug]/page.tsx    产品详情页
    material/page.tsx           原生肌凝硅材质科技
    guide/page.tsx              使用与清洁指南
    privacy-shipping/page.tsx   隐私发货说明
    faq/page.tsx                常见问题
    articles/page.tsx           文章栏目
    articles/[slug]/page.tsx    文章详情页
    buy/page.tsx                官方渠道购买路径
    contact/page.tsx            联系我们
    privacy-policy/page.tsx     隐私政策
    terms/page.tsx              用户协议
    disclaimer/page.tsx         免责声明
    sitemap.ts                  sitemap.xml
    robots.ts                   robots.txt
  components/                   可复用组件
  data/catalog/                 正式商品分类、系列、商品与人工覆盖
  lib/
    catalog.ts                  商品目录读取、筛选与人工覆盖合并
    products.ts                 兼容旧页面导入的商品数据出口
    articles.ts                 文章数据集中维护
    analytics.ts                埋点事件
    constants.ts                品牌、站点与统计配置
  config/
    storeLinks.ts               天猫与京东购买链接集中维护
public/images/                  Logo、产品图与品牌细节图
data/catalog/                   公开采集快照、规范化数据与人工复核表
scripts/                        商品采集、规范化、匹配、校验脚本
```

## 本地运行

标准环境：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

生产构建：

```bash
npm run build
npm run start
```

商品目录校验：

```bash
npm run catalog:validate
```

店铺商品同步候选流程：

```bash
npm run catalog:discover
npm run catalog:normalize
npm run catalog:match
npm run catalog:review
```

`catalog:sync` 只会生成候选数据和复核文件，不会直接覆盖正式商品配置。正式上线数据仍以 `src/data/catalog/products.ts` 与 `src/data/catalog/manual-overrides.ts` 为准。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
NEXT_PUBLIC_SITE_URL=https://你的域名
NEXT_PUBLIC_TMALL_STORE_URL=https://minvlang.tmall.com/
NEXT_PUBLIC_JD_STORE_URL=https://mall.jd.com/index-127854045.html?cid=0
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_BAIDU_TONGJI_ID=
```

上线前将 `NEXT_PUBLIC_TMALL_STORE_URL` 替换为真实天猫旗舰店链接，将 `NEXT_PUBLIC_JD_STORE_URL` 替换为真实京东旗舰店链接。

## 关键文件

- `src/data/catalog/products.ts`：正式商品数据；三款原生肌凝硅新品目前为 `upcoming`。
- `src/data/catalog/manual-overrides.ts`：人工覆盖，优先级最高；确认半身款链接后在这里补充。
- `data/catalog/review/product-matching.csv`：天猫与京东同款关系待复核表。
- `src/lib/catalog.ts`：前端读取商品目录的统一入口。
- `src/lib/articles.ts`：新增科普文章、维护关键词与大纲。
- `src/lib/constants.ts`：修改品牌信息、站点域名和统计配置。
- `src/config/storeLinks.ts`：集中维护天猫旗舰店与京东旗舰店链接。
- `src/components/StoreButtons.tsx`：统一官方渠道按钮与点击埋点。
- `src/components/AgeGate.tsx`：18+ 年龄提示。

## 合规边界

- 不面向未成年人。
- 不写低俗、露骨或过度擦边表达。
- 不虚构认证、检测报告、专利、销量或用户评价。
- 不承诺医疗、健康、情感或能力效果。
- 原生肌凝硅作为品牌材质科技表达，不包装为医疗材料或法定认证。
- 未上架新品不显示购买按钮、价格、库存、销量、评价或上架日期。
- 未确认的天猫/京东同款关系进入人工复核表，不强行合并。
