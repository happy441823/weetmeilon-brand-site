import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const database = "sweetmeilon-cms-prod";
const shouldApply = process.argv.includes("--apply");

const slugs = [
  "tpe-vs-silicone-material-guide",
  "cleaning-and-storage-guide",
  "privacy-shipping-guide",
  "how-to-choose-cup-products",
  "mold-products-care-guide"
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
  "100%",
  "原生肌凝硅",
  "凝硅",
  "Native Skin Silicone",
  "native-skin-silicone"
];

const articles = {
  "tpe-vs-silicone-material-guide": {
    title: "TPE 和硅胶有什么区别？购买前先看材质、触感与保养差异",
    excerpt: "从材质触感、回弹表现、清洁收纳和购买前确认事项，梳理 TPE 与硅胶产品的基础区别。",
    seo_title: "TPE 和硅胶材质区别｜触感、清洁与收纳说明｜蜜女郎",
    seo_description:
      "了解 TPE 和硅胶在触感、回弹、清洁、收纳和购买前确认事项上的差异。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。",
    keywords: ["TPE", "硅胶", "材质区别", "清洁收纳", "蜜女郎"],
    toc: ["先看结论", "材质与触感", "清洁收纳", "购买前确认", "常见问题"],
    body: String.raw`<h2>先看结论</h2>
<p>TPE 和硅胶都常见于私密产品，但它们在触感、回弹、重量感、表面细节和日常护理上会有差异。选购时不建议只看名称，更应该结合商品页面里的材质标注、结构说明、尺寸信息和清洁收纳要求一起判断。</p>
<p>如果你是第一次了解这类产品，可以先从使用场景、可接受的重量、清洁习惯和收纳空间入手。官网内容用于帮助理解差异，具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。</p>
<h2>材质与触感怎么理解</h2>
<p>TPE 通常会被描述为柔软、亲肤、回弹明显，适合关注柔韧感和轻松收纳的用户。硅胶通常更强调稳定性、轮廓细节和表面质感，适合关注形态保持和长期护理习惯的用户。</p>
<p>不同商品的实际表现还会受到配方、厚度、结构和表面处理影响。不要只凭材质名称判断，应同时查看商品图、规格表和官方说明。</p>
<h2>清洁、晾干和收纳差异</h2>
<p>两类材质都需要在使用前后做好基础清洁，并在完全晾干后再收纳。收纳时建议单独放置，避免与深色、尖锐或容易掉色的物品长期接触。</p>
<p>如果你更关注护理流程，可以先阅读 <a href="/articles/cleaning-and-storage-guide">清洁收纳指南</a>，再结合具体商品说明选择更适合自己的材质方向。</p>
<h2>购买前建议确认哪些信息</h2>
<ul><li>材质标注是否清楚，是否和商品标题、规格说明一致。</li><li>尺寸、重量、结构是否适合自己的收纳和清洁条件。</li><li>是否有明确的官方购买入口和售后说明。</li><li>是否能接受对应材质的护理要求。</li></ul>
<p>你也可以从 <a href="/products">产品中心</a> 查看不同类型商品，或阅读 <a href="/articles/mold-products-care-guide">倒模类产品保养指南</a> 了解日常护理方式。</p>
<h2>18+ 内容边界说明</h2>
<p>本文仅面向已满 18 周岁的成年人，内容用于材质认知、清洁保养和购买前信息核对，不面向未成年人，也不替代商品页面的正式说明。</p>
<h2>常见问题</h2>
<h3>TPE 和硅胶哪个更适合新手？</h3><p>建议先看清洁习惯、可接受重量和收纳条件。不同商品差异较大，不能只用材质名称直接判断。</p>
<h3>材质说明以哪里为准？</h3><p>以蜜女郎官方旗舰店商品页面、规格说明和客服回复为准。</p>
<h3>可以只看官网文章决定购买吗？</h3><p>不建议。官网文章适合做购买前理解，具体商品信息仍要回到官方渠道确认。</p>
<h2>相关链接</h2>
<p><a href="/material">查看材质专题</a> · <a href="/products">浏览产品中心</a> · <a href="/faq">查看常见问题</a></p>`
  },
  "cleaning-and-storage-guide": {
    title: "私密产品如何清洁和收纳？使用前后护理指南",
    excerpt: "围绕使用前检查、使用后清洁、自然晾干、单独收纳和隐私保存，整理基础护理方法。",
    seo_title: "私密产品清洁收纳指南｜使用前后护理说明｜蜜女郎",
    seo_description:
      "了解私密产品在使用前检查、使用后清洁、晾干、收纳和隐私保存中的基础护理方法。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。",
    keywords: ["清洁", "收纳", "护理", "隐私保存", "蜜女郎"],
    toc: ["使用前检查", "使用后清洁", "晾干收纳", "隐私保存", "常见问题"],
    body: String.raw`<h2>使用前先做基础检查</h2>
<p>使用前建议先确认产品表面是否完整、是否有明显异味或异常痕迹，并查看商品页面中的材质与护理说明。不同材质对水温、清洁用品和晾干方式的要求可能不同，先确认再使用会更稳妥。</p>
<p>如果产品带有配件、加热或震动等功能，请先阅读对应说明，避免让接口、控制区域或不适合进水的位置接触大量水分。</p>
<h2>使用后清洁要及时且温和</h2>
<p>使用后建议尽快清洁。一般可以使用温和清洁方式处理表面，再用干净毛巾轻轻吸走水分。不要用尖锐工具刮擦，也不要长期浸泡。</p>
<p>如果商品页面有指定清洁方法，应优先按照官方说明执行。官网文章只提供通用护理思路，具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。</p>
<h2>完全晾干后再单独收纳</h2>
<p>收纳前要确认表面和缝隙处已经充分干燥。潮湿环境容易影响保存状态，也可能让包装内产生异味。建议单独使用收纳袋或收纳盒，避免与深色衣物、尖锐物品或化妆品混放。</p>
<p>如果你对收货和保存方式比较在意，可以继续阅读 <a href="/articles/privacy-shipping-guide">隐私购买与收货提示</a>。</p>
<h2>长期保存的几个细节</h2>
<ul><li>放在阴凉、干燥、通风的位置。</li><li>避免长期受压，减少变形风险。</li><li>定期查看表面状态，发现异常及时停止使用并咨询官方渠道。</li><li>配件与主体分开收纳，方便下次检查。</li></ul>
<h2>18+ 内容边界说明</h2>
<p>本文仅面向已满 18 周岁的成年人，内容用于清洁、收纳和护理信息参考，不面向未成年人。</p>
<h2>常见问题</h2>
<h3>每次使用后都需要清洁吗？</h3><p>建议使用后及时清洁，并在完全晾干后再收纳。</p>
<h3>能和其他物品放在一起吗？</h3><p>不建议混放，尤其应避免深色、尖锐或容易掉色的物品。</p>
<h3>护理方式不确定怎么办？</h3><p>优先查看官方旗舰店商品页面，必要时咨询官方客服。</p>
<h2>相关链接</h2>
<p><a href="/guide">查看清洁指南</a> · <a href="/faq">查看常见问题</a> · <a href="/products">浏览产品中心</a></p>`
  },
  "privacy-shipping-guide": {
    title: "隐私购买与收货提示：包装、面单与收货时需要注意什么",
    excerpt: "围绕包装、面单、物流通知、收货地址和售后沟通，整理隐私购买前需要确认的细节。",
    seo_title: "隐私购买与收货提示｜包装、面单与售后沟通说明｜蜜女郎",
    seo_description:
      "了解隐私购买中的包装、面单、物流通知、收货地址和售后沟通注意事项。具体发货和售后信息请以蜜女郎官方旗舰店页面为准。",
    keywords: ["隐私购买", "隐私发货", "包装面单", "收货提示", "蜜女郎"],
    toc: ["包装面单", "收货安排", "售后沟通", "官方渠道", "常见问题"],
    body: String.raw`<h2>先确认包装与面单说明</h2>
<p>私密产品购买前，很多人最关心的是外包装、面单展示和物流通知。官网可以提供通用提醒，但具体包装方式、发货规则和面单信息，仍要以蜜女郎官方旗舰店页面及客服说明为准。</p>
<p>下单前建议查看商品详情页、店铺服务说明和购买须知。如果页面信息不够明确，再通过官方客服确认，避免只根据经验或第三方说法判断。</p>
<h2>收货安排要减少额外暴露</h2>
<p>尽量选择本人方便接收的地址，留意平台物流通知和取件方式。如果使用驿站、公司地址或共享收货点，需要考虑短信、电话、包裹暂存和他人代收带来的信息可见性。</p>
<p>如果对隐私要求较高，可以在下单前咨询是否支持更适合自己的收货方式。不要在非官方渠道透露订单号、联系方式或详细地址。</p>
<h2>售后沟通也要控制信息范围</h2>
<p>售后沟通建议优先在官方旗舰店平台内完成，便于保留记录，也能减少个人信息分散在多个渠道。沟通时只提供处理问题所需的信息，不主动发送无关证明、地址截图或聊天记录。</p>
<p>官网不直接处理订单、发货和售后。涉及退款、换货、物流异常和发票等问题，应以对应平台和官方旗舰店规则为准。</p>
<h2>购买前可以做的小检查</h2>
<ul><li>确认官方渠道入口是否正确。</li><li>确认收货地址是否适合本人接收。</li><li>确认平台通知方式，避免重要信息遗漏。</li><li>确认售后沟通只在官方平台内完成。</li></ul>
<h2>18+ 内容边界说明</h2>
<p>本文仅面向已满 18 周岁的成年人，内容用于隐私购买和收货信息参考，不面向未成年人。</p>
<h2>常见问题</h2>
<h3>包装信息以哪里为准？</h3><p>以蜜女郎官方旗舰店商品页面和客服说明为准。</p>
<h3>可以使用代收点吗？</h3><p>可以结合个人情况选择，但要考虑通知、暂存和他人代收带来的信息可见性。</p>
<h3>售后需要去哪里沟通？</h3><p>建议优先在官方旗舰店平台内沟通，便于保留记录。</p>
<h2>相关链接</h2>
<p><a href="/privacy-shipping">查看隐私发货说明</a> · <a href="/faq">查看常见问题</a> · <a href="/buy">查看官方渠道</a></p>`
  },
  "how-to-choose-cup-products": {
    title: "飞机杯如何选择？从尺寸、材质、结构和清洁收纳开始了解",
    excerpt: "从尺寸、材质、结构、清洁和收纳角度，整理杯类产品购买前的基础判断方法。",
    seo_title: "飞机杯如何选择｜尺寸、材质、结构与清洁收纳说明｜蜜女郎",
    seo_description:
      "了解杯类产品在尺寸、材质、结构、清洁和收纳方面的基础选择思路。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。",
    keywords: ["飞机杯", "杯类产品", "尺寸选择", "清洁收纳", "蜜女郎"],
    toc: ["先看尺寸", "材质结构", "清洁收纳", "官方渠道", "常见问题"],
    body: String.raw`<h2>先从尺寸和握持感判断</h2>
<p>杯类产品的选择不建议只看标题。更稳妥的方法是先看尺寸、重量、外壳结构和清洁方式，再判断是否适合自己的收纳空间和护理习惯。</p>
<p>如果是第一次了解，可以优先选择说明清楚、结构简单、清洁步骤明确的款式。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。</p>
<h2>材质与结构要一起看</h2>
<p>材质会影响触感和护理方式，结构会影响握持、清洁和晾干。部分产品会强调外壳、开口、内部结构或配件，购买前建议结合商品图和规格说明一起确认。</p>
<p>如果你主要关注材质差异，可以先阅读 <a href="/articles/tpe-vs-silicone-material-guide">TPE 和硅胶材质区别</a>；如果更在意护理流程，可以阅读 <a href="/articles/cleaning-and-storage-guide">清洁收纳指南</a>。</p>
<h2>清洁和收纳是否方便很重要</h2>
<p>杯类产品使用后需要及时清洁并完全晾干。选购时可以留意是否容易拆卸、是否方便冲洗、是否需要单独收纳，以及是否适合自己的日常护理习惯。</p>
<h2>官方渠道说明</h2>
<p>官网文章用于帮助理解产品类型和选择思路，不直接处理订单。购买前请通过蜜女郎官方旗舰店确认具体商品信息、发货与售后说明。</p>
<h2>18+ 内容边界说明</h2>
<p>本文仅面向已满 18 周岁的成年人，内容用于产品类型认知和购买前信息核对，不面向未成年人。</p>
<h2>常见问题</h2>
<h3>杯类产品应该先看什么？</h3><p>建议先看尺寸、结构、材质标注和清洁方式，再看是否适合自己的收纳条件。</p>
<h3>标题里的描述可以直接作为判断依据吗？</h3><p>不建议。应结合商品图、规格说明和官方客服信息一起确认。</p>
<h3>购买入口在哪里？</h3><p>可从官网官方渠道入口前往蜜女郎官方旗舰店，具体商品信息以店铺页面为准。</p>
<h2>相关链接</h2>
<p><a href="/products/category/masturbator-cups">查看杯类产品</a> · <a href="/articles/cleaning-and-storage-guide">查看清洁收纳指南</a> · <a href="/faq">查看常见问题</a></p>`
  },
  "mold-products-care-guide": {
    title: "倒模类产品如何保养？清洁、晾干、收纳与日常护理建议",
    excerpt: "整理倒模类产品在使用前检查、清洁、晾干、收纳和日常护理中的基础注意事项。",
    seo_title: "倒模类产品保养指南｜清洁、晾干与收纳说明｜蜜女郎",
    seo_description:
      "了解倒模类产品在清洁、晾干、收纳和日常护理中的基础注意事项。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。",
    keywords: ["倒模类产品", "保养", "清洁晾干", "收纳护理", "蜜女郎"],
    toc: ["使用前检查", "清洁晾干", "收纳护理", "官方渠道", "常见问题"],
    body: String.raw`<h2>使用前先检查表面和结构</h2>
<p>倒模类产品通常更关注轮廓、材质触感和整体形态。使用前建议先查看表面是否完整，确认是否有明显破损、粘连或异常痕迹，并结合商品页面了解对应材质的护理要求。</p>
<p>如果产品尺寸较大或结构较复杂，建议提前准备好清洁、晾干和收纳空间，避免使用后临时处理不方便。</p>
<h2>清洁后要充分晾干</h2>
<p>倒模类产品清洁时要温和处理表面和边角，避免用力拉扯或使用尖锐工具。清洁后可以用干净毛巾轻轻吸走水分，再放在通风处充分晾干。</p>
<p>具体清洁方式应优先参考官方旗舰店商品页面和说明。如果你需要更通用的护理步骤，可以阅读 <a href="/articles/cleaning-and-storage-guide">清洁收纳指南</a>。</p>
<h2>收纳时避免受压和混放</h2>
<p>收纳前确认表面干燥，并尽量单独放置。不要长期重压，也不要与深色、尖锐或容易掉色的物品混放。较大尺寸产品可以结合收纳袋、收纳箱或独立空间保存。</p>
<h2>官方渠道说明</h2>
<p>官网文章用于帮助理解保养思路，不直接处理订单。具体材质、规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。</p>
<h2>18+ 内容边界说明</h2>
<p>本文仅面向已满 18 周岁的成年人，内容用于清洁保养和购买前信息核对，不面向未成年人。</p>
<h2>常见问题</h2>
<h3>倒模类产品需要单独收纳吗？</h3><p>建议单独收纳，避免受压、染色或与尖锐物品接触。</p>
<h3>清洁后多久可以收起来？</h3><p>应等表面和缝隙处充分干燥后再收纳。</p>
<h3>护理方式不确定怎么办？</h3><p>优先查看蜜女郎官方旗舰店商品页面，必要时咨询官方客服。</p>
<h2>相关链接</h2>
<p><a href="/products/category/intimate-molds">查看倒模类产品</a> · <a href="/guide">查看清洁指南</a> · <a href="/faq">查看常见问题</a></p>`
  }
};

function shellQuote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function run(command) {
  const result = spawnSync(command, {
    encoding: "utf8",
    shell: true
  });
  if (result.status !== 0) {
    throw new Error(`${command}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function scan(text) {
  return forbidden.filter((word) => text.includes(word));
}

function parseWranglerJson(output) {
  const trimmed = output.trim();
  return JSON.parse(trimmed)[0]?.results || [];
}

const selectSql = `SELECT id, slug, title, status, indexable, seo_title, seo_description, excerpt, canonical_url, body_html FROM articles WHERE slug IN (${slugs.map(sqlString).join(",")}) ORDER BY slug;`;
const rows = parseWranglerJson(
  run(`npx.cmd wrangler d1 execute ${database} --remote --json --command ${shellQuote(selectSql)}`)
);

const now = new Date().toISOString();
const updates = [];
const dryRows = [];

for (const slug of slugs) {
  const current = rows.find((row) => row.slug === slug);
  const next = articles[slug];
  if (!current) {
    throw new Error(`Missing article in production D1: ${slug}`);
  }
  const canonical = `https://sweetmeilon.com/articles/${slug}`;
  const keywordsJson = JSON.stringify(next.keywords);
  const tocJson = JSON.stringify(next.toc.map((label) => ({ label })));
  const nextText = [
    next.title,
    next.excerpt,
    next.seo_title,
    next.seo_description,
    next.body,
    keywordsJson,
    tocJson
  ].join("\n");
  const hits = scan(nextText);
  if (hits.length > 0) {
    throw new Error(`${slug} contains forbidden terms: ${hits.join(", ")}`);
  }

  updates.push(`UPDATE articles SET
  title = ${sqlString(next.title)},
  excerpt = ${sqlString(next.excerpt)},
  body_html = ${sqlString(next.body)},
  seo_title = ${sqlString(next.seo_title)},
  seo_description = ${sqlString(next.seo_description)},
  canonical_url = ${sqlString(canonical)},
  keywords_json = ${sqlString(keywordsJson)},
  toc_json = ${sqlString(tocJson)},
  updated_at = ${sqlString(now)}
WHERE slug = ${sqlString(slug)};`);

  dryRows.push({
    slug,
    id: current.id,
    status: current.status,
    indexable: current.indexable,
    oldTitle: current.title,
    newTitle: next.title,
    oldSeoTitle: current.seo_title,
    newSeoTitle: next.seo_title,
    oldSeoDescription: current.seo_description,
    newSeoDescription: next.seo_description,
    oldBodyLength: String(current.body_html || "").length,
    newBodyLength: next.body.length,
    faqCount: (next.body.match(/<h3>/g) || []).length,
    links: [...next.body.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
  });
}

const sql = updates.join("\n\n");
writeFileSync("ARTICLE_ROUND2_OPTIMIZATION.sql", `${sql}\n`, "utf8");

const dryRun = `# SWEETMEILON 文章第二轮优化 Dry Run

生成时间：${now}

## 执行边界

- 计划优化 5 篇已发布文章的正文、摘要、SEO Title、SEO Description、关键词、目录和 canonical。
- 不修改 status。
- 不修改 indexable。
- 不修改商品数据。
- 不修改 Cloudflare Access / D1 / R2 绑定。
- 不开启 IndexNow。
- 不部署生产。

## 计划修改文章

${dryRows
  .map(
    (row, index) => `### ${index + 1}. ${row.slug}

- Article ID：${row.id}
- 当前状态：${row.status}
- indexable：${row.indexable}
- 旧标题：${row.oldTitle}
- 新标题：${row.newTitle}
- 旧 SEO Title：${row.oldSeoTitle}
- 新 SEO Title：${row.newSeoTitle}
- 旧 SEO Description：${row.oldSeoDescription}
- 新 SEO Description：${row.newSeoDescription}
- 正文长度：${row.oldBodyLength} -> ${row.newBodyLength}
- FAQ 数量：${row.faqCount}
- 内链：${row.links.join("、")}
- 是否影响状态：否
- 是否影响 sitemap：不直接修改；发布且 indexable 的文章继续进入 sitemap
- 是否误用“原生肌凝硅/凝硅”：否
`
  )
  .join("\n")}

## 风险词扫描

- 强刺激词：0
- 动态交易词：0
- 医疗/绝对化词：0
- 原生肌凝硅误用：0

## SQL 文件

- ARTICLE_ROUND2_OPTIMIZATION.sql
`;

writeFileSync("ARTICLE_ROUND2_OPTIMIZATION_DRY_RUN.md", dryRun, "utf8");

let applyOutput = "未执行正式写入。";
if (shouldApply) {
  applyOutput = run(`npx.cmd wrangler d1 execute ${database} --remote --file ARTICLE_ROUND2_OPTIMIZATION.sql`);
}

const verificationRows = shouldApply
  ? parseWranglerJson(
      run(`npx.cmd wrangler d1 execute ${database} --remote --json --command ${shellQuote(selectSql)}`)
    )
  : rows;

const verification = verificationRows.map((row) => {
  const text = [row.title, row.excerpt, row.seo_title, row.seo_description, row.body_html].join("\n");
  return {
    slug: row.slug,
    status: row.status,
    indexable: row.indexable,
    bodyLength: String(row.body_html || "").length,
    forbiddenHits: scan(text)
  };
});

const report = `# SWEETMEILON 文章第二轮优化报告

生成时间：${now}

## 写入结果

- 是否执行正式写入：${shouldApply ? "是" : "否"}
- 目标数据库：${database}
- 优化文章数量：5
- 实际修改字段：title、excerpt、body_html、seo_title、seo_description、canonical_url、keywords_json、toc_json、updated_at
- 是否修改 status：否
- 是否修改 indexable：否
- 是否修改商品数据：否
- 是否修改 Cloudflare 配置：否
- 是否部署生产：否

## Wrangler 输出

\`\`\`text
${applyOutput.trim()}
\`\`\`

## D1 复核

${verification
  .map(
    (row) => `- ${row.slug}：status=${row.status}，indexable=${row.indexable}，body_len=${row.bodyLength}，风险词=${row.forbiddenHits.length}`
  )
  .join("\n")}

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
`;

writeFileSync("ARTICLE_ROUND2_OPTIMIZATION_REPORT.md", report, "utf8");

console.log(shouldApply ? "Applied article round 2 optimization." : "Generated article round 2 dry-run.");
console.log("ARTICLE_ROUND2_OPTIMIZATION_DRY_RUN.md");
console.log("ARTICLE_ROUND2_OPTIMIZATION.sql");
console.log("ARTICLE_ROUND2_OPTIMIZATION_REPORT.md");
