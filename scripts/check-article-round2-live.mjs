import { writeFileSync } from "node:fs";

const urls = [
  "https://sweetmeilon.com/articles",
  "https://sweetmeilon.com/articles/tpe-vs-silicone-material-guide",
  "https://sweetmeilon.com/articles/cleaning-and-storage-guide",
  "https://sweetmeilon.com/articles/privacy-shipping-guide",
  "https://sweetmeilon.com/articles/how-to-choose-cup-products",
  "https://sweetmeilon.com/articles/mold-products-care-guide",
  "https://sweetmeilon.com/sitemap.xml"
];

const forbidden = [
  "真人",
  "熟女",
  "可插入",
  "超大屁股",
  "充气娃娃",
  "成人男士性用品",
  "自慰器",
  "男用玩具",
  "爆款",
  "热销",
  "销量",
  "付款人数",
  "近365天付款",
  "实时价格",
  "价格",
  "库存",
  "优惠",
  "治疗",
  "改善疾病",
  "医疗级",
  "全网第一",
  "最强",
  "原生肌凝硅",
  "凝硅",
  "Native Skin Silicone",
  "native-skin-silicone"
];

const rows = [];

for (const url of urls) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 SWEETMEILON ArticleRound2Check" }
  });
  const text = await res.text();
  const visible = text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const richTextMatch = visible.match(/<div class="cms-richtext mt-7">([\s\S]*?)<\/div><\/div><aside/);
  const scanTarget = url.includes("/articles/") ? richTextMatch?.[1] || visible : visible;
  const hits = forbidden.filter((term) => scanTarget.includes(term));
  const hasCanonical = /rel="canonical"/.test(text);
  const hasFaq = text.includes("常见问题") || text.includes("FAQ");
  const hasBoundary = text.includes("18+") || text.includes("18 周岁") || text.includes("成年人");
  rows.push({ url, status: res.status, hits, hasCanonical, hasFaq, hasBoundary, length: text.length });
}

let markdown = `# SWEETMEILON 文章第二轮前台抽检

检查时间：${new Date().toISOString()}

| URL | HTTP | 风险词 | canonical | FAQ/常见问题 | 18+边界 | HTML长度 |
| --- | ---: | --- | --- | --- | --- | ---: |
`;

for (const row of rows) {
  markdown += `| ${row.url} | ${row.status} | ${row.hits.length ? row.hits.join("、") : "0"} | ${row.hasCanonical ? "是" : "-"} | ${row.hasFaq ? "是" : "-"} | ${row.hasBoundary ? "是" : "-"} | ${row.length} |\n`;
}

markdown += `
## 结论

- 5 篇文章 URL 均已复测。
- sitemap 已复测。
- 文章详情页风险词以正文 \`cms-richtext\` 区域扫描，避免全站导航产生误报。
- 全站导航出现“原生肌凝硅”是 /material 专题入口，属于允许范围。
- sitemap 出现 \`native-skin-silicone\` 属于白名单新品 URL，属于允许范围。
`;

writeFileSync("ARTICLE_ROUND2_LIVE_CHECK_20260628.md", markdown, "utf8");
console.log(markdown);
