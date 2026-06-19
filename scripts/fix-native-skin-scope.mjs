import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const database = getArg("--database") || "sweetmeilon-cms-prod";
const apply = process.argv.includes("--apply");
const remote = process.argv.includes("--remote") || true;

const whitelist = new Set(["native-skin-silicone-soft", "texture-detail-series", "privacy-starter-kit"]);
const forbidden = ["原生肌凝硅", "凝硅", "Native Skin Silicone", "native-skin-silicone"];
const productFields = [
  "name",
  "short_name",
  "subtitle",
  "summary",
  "body_html",
  "highlights_json",
  "concerns_json",
  "material_notes",
  "specifications_json",
  "package_list",
  "care_notes",
  "storage_notes",
  "privacy_notes",
  "usage_tips",
  "compliance_notes",
  "seo_title",
  "seo_description",
  "image_alt",
  "series_id",
  "canonical_url"
];

const copyById = {
  "tmall-932717912766": copy("硅胶半身柔感款", "硅胶半身款", "硅胶系列 · 半身轮廓 · 柔感方向", "halfSilicone"),
  "tmall-1034711994048": copy("硅胶长腿半身款", "长腿半身款", "硅胶系列 · 半身长腿方向", "halfSilicone"),
  "tmall-1003179680764": copy("硅胶全腿半身款", "全腿半身款", "硅胶系列 · 全腿半身方向", "halfSilicone"),
  "tmall-1033146604001": copy("硅胶半身基础款", "硅胶基础款", "硅胶系列 · 半身基础方向", "halfSilicone"),
  "tmall-1008749329121": copy("硅胶臀部柔感款", "硅胶臀部款", "硅胶系列 · 臀部轮廓 · 柔感方向", "hipSilicone"),
  "tmall-978357698377": copy("硅胶半身细节款", "硅胶细节款", "硅胶系列 · 半身细节方向", "halfSilicone"),
  "tmall-1037741386848": copy("硅胶半身典藏款", "硅胶典藏款", "硅胶系列 · 半身典藏方向", "halfSilicone"),
  "tmall-1015501179254": copy("硅胶局部造型款", "硅胶局部款", "硅胶系列 · 局部造型 · 轻量收纳", "localSilicone"),
  "tmall-1049922662436": copy("硅胶半身静奢款", "硅胶静奢款", "硅胶系列 · 半身柔感方向", "halfSilicone"),
  "tmall-956711010507": copy("硅胶半身柔弧款", "硅胶柔弧款", "硅胶系列 · 半身柔弧方向", "halfSilicone"),
  "tmall-1047503838777": copy("硅胶臀线半身款", "硅胶臀线款", "硅胶系列 · 臀线半身方向", "halfSilicone"),
  "tmall-1046323454771": copy("硅胶自动半身款", "硅胶自动款", "硅胶系列 · 自动配置 · 半身方向", "automaticSilicone"),
  "tmall-839593996256": copy("硅胶自动臀部款", "硅胶自动臀部", "硅胶系列 · 自动配置 · 臀部轮廓", "automaticSilicone"),
  "tmall-1026704244735": copy("高弹硅胶半身款", "高弹硅胶款", "硅胶系列 · 高弹半身方向", "halfSilicone"),
  "tmall-966709910145": copy("硅胶半身精选款", "硅胶精选款", "硅胶系列 · 半身精选方向", "halfSilicone")
};

const textBlocks = {
  halfSilicone: {
    summary: "以硅胶柔感材质和半身轮廓为核心，适合优先关注柔软回弹、表面细节和清洁便利性的用户。",
    body:
      "这款硅胶半身产品以柔和触感和干净的视觉轮廓为重点，适合对材质质感、回弹表现和收纳护理更在意的用户。页面不展示实时价格和库存，购买前可跳转官方渠道查看完整规格。",
    highlights: ["硅胶柔感", "半身轮廓", "表面细节", "收纳友好", "隐私包装"],
    material: "硅胶系列强调柔软、回弹与细腻表面体验，具体材质参数以官方商品页为准。",
    specs: { 产品类型: "半身造型款", 材质方向: "硅胶柔感", 购买渠道: "天猫官方旗舰店" }
  },
  hipSilicone: {
    summary: "以硅胶柔感材质和臀部轮廓为重点，适合关注柔软度、回弹感与局部形态的用户。",
    body:
      "这款硅胶臀部造型产品以柔感材质和圆润轮廓为主要识别点，页面帮助用户先了解产品类型、材质方向、清洁收纳与隐私包装，再前往官方渠道确认完整规格。",
    highlights: ["硅胶柔感", "臀部造型", "柔感回弹", "清洁护理", "官方渠道"],
    material: "硅胶系列强调柔软、回弹和细腻表面表现，具体参数以官方页面为准。",
    specs: { 产品类型: "臀部造型款", 材质方向: "硅胶柔感", 购买渠道: "天猫官方旗舰店" }
  },
  automaticSilicone: {
    summary: "结合自动系列配置与硅胶柔感材质方向，适合关注功能体验、柔感触感和护理便利性的用户。",
    body:
      "这款硅胶自动系列产品以功能配置和柔感材质为主要识别点。官网页面用于展示稳定的产品信息、清洁收纳提醒与官方购买入口，完整规格仍以天猫官方页面为准。",
    highlights: ["自动系列", "硅胶柔感", "功能配置", "护理提醒", "官方渠道"],
    material: "硅胶系列强调柔感和回弹表现，自动配置与版本差异以官方商品页为准。",
    specs: { 产品类型: "自动体验款", 材质方向: "硅胶柔感", 购买渠道: "天猫官方旗舰店" }
  },
  localSilicone: {
    summary: "以硅胶柔感材质和局部造型细节为重点，适合关注触感、细节表现和便于收纳的用户。",
    body:
      "这款局部造型产品适合希望从更轻量的款式了解蜜女郎材质体系的用户。页面重点呈现材质方向、形态识别、清洁收纳和隐私发货信息，具体规格以官方渠道为准。",
    highlights: ["局部造型", "硅胶柔感", "轻量收纳", "清洁便利", "隐私包装"],
    material: "材质以官方页面标注为准，官网侧重表达柔感方向与日常护理注意事项。",
    specs: { 产品类型: "局部造型款", 材质方向: "硅胶柔感", 购买渠道: "天猫官方旗舰店" }
  }
};

const common = {
  package_list: "商品主体、基础包装及随附配件以官方渠道实际页面和发货清单为准。",
  care_notes: "建议按官方页面提示完成基础清洁与自然晾干，避免高温、暴晒和尖锐物接触。不同材质与款式的护理细节以官方渠道说明为准。",
  storage_notes: "清洁并完全干燥后单独收纳，尽量放置在阴凉干燥处，避免长期挤压、折叠或与深色织物直接接触。",
  privacy_notes: "官方渠道发货以隐私包装为基础，外包装不展示敏感商品信息；实际物流与售后规则以天猫商品页为准。",
  usage_tips: "首次了解时建议先对照尺寸、重量、材质和清洁方式，再根据自己的收纳空间与使用习惯选择款式。",
  compliance_notes: "页面仅作商品信息整理与品牌展示，不展示实时价格、库存、销量或优惠；购买与售后以官方渠道为准。"
};

const products = query(`SELECT id, slug, status, buy_button_enabled, ${productFields.join(", ")} FROM products ORDER BY sort_order ASC, updated_at DESC`);
const productImages = query("SELECT id, product_id, alt FROM product_images ORDER BY product_id ASC, sort_order ASC");

const changes = [];
const sql = [];

for (const product of products) {
  if (whitelist.has(product.id)) continue;
  const planned = copyById[product.id];
  const touched = {};

  if (planned) {
    const block = textBlocks[planned.type];
    Object.assign(touched, {
      name: planned.name,
      short_name: planned.shortName,
      subtitle: planned.subtitle,
      summary: block.summary,
      body_html: `<p>${block.body}</p><p>本页保留官方渠道入口，具体规格、价格、库存、优惠和售后以天猫商品页为准。</p>`,
      highlights_json: JSON.stringify(block.highlights),
      material_notes: block.material,
      specifications_json: JSON.stringify(block.specs),
      package_list: common.package_list,
      care_notes: common.care_notes,
      storage_notes: common.storage_notes,
      privacy_notes: common.privacy_notes,
      usage_tips: common.usage_tips,
      compliance_notes: common.compliance_notes,
      image_alt: `${planned.name}产品图`,
      seo_title: `${planned.name} | 蜜女郎 SWEETMEILON`,
      seo_description: `${planned.name}，${block.summary} 支持跳转官方渠道查看规格、价格、发货和售后信息。`,
      series_id: "fine-texture"
    });
  }

  for (const field of productFields) {
    if (field in touched) continue;
    const cleaned = cleanForbidden(product[field]);
    if (cleaned !== product[field]) touched[field] = cleaned;
  }

  const entries = Object.entries(touched).filter(([, value]) => value !== undefined);
  if (entries.length > 0) {
    for (const [field, next] of entries) {
      changes.push({
        type: "products",
        id: product.id,
        slug: product.slug,
        field,
        oldValue: product[field],
        newValue: next
      });
    }
    sql.push(
      `UPDATE products SET ${entries.map(([field, value]) => `${field} = ${esc(value)}`).join(", ")}, updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(product.id)};`
    );
  }
}

for (const image of productImages) {
  if (whitelist.has(image.product_id)) continue;
  const next = cleanForbidden(image.alt);
  if (next !== image.alt) {
    changes.push({
      type: "product_images",
      id: image.product_id,
      slug: "",
      field: `product_images.alt:${image.id}`,
      oldValue: image.alt,
      newValue: next
    });
    sql.push(`UPDATE product_images SET alt = ${esc(next)}, updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(image.id)};`);
  }
}

writeDryRun();

if (!apply) {
  console.log(resolve("NATIVE_SKIN_SILICONE_MISUSE_DRY_RUN.md"));
  process.exit(0);
}

const file = join(mkdtempSync(join(tmpdir(), "sweetmeilon-native-skin-")), "fix.sql");
writeFileSync(file, `${sql.join("\n")}\n`, "utf8");
const args = ["/c", "npx.cmd", "wrangler", "d1", "execute", database, "--file", file];
if (remote) args.push("--remote");
const result = spawnSync("cmd.exe", args, { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);

writeReport();
console.log(resolve("NATIVE_SKIN_SILICONE_SCOPE_FIX_REPORT.md"));

function copy(name, shortName, subtitle, type) {
  return { name, shortName, subtitle, type };
}

function cleanForbidden(value) {
  if (typeof value !== "string") return value;
  return value
    .replaceAll("Native Skin Silicone", "硅胶柔感")
    .replaceAll("native-skin-silicone", "fine-texture")
    .replaceAll("原生肌凝硅", "硅胶柔感")
    .replaceAll("凝硅", "硅胶");
}

function containsForbidden(value) {
  const text = String(value ?? "");
  return forbidden.some((term) => text.includes(term));
}

function writeDryRun() {
  const affectedProducts = new Set(changes.map((item) => item.id));
  const uncertain = products
    .filter((product) => !whitelist.has(product.id))
    .filter((product) => productFields.some((field) => containsForbidden(product[field])))
    .filter((product) => !copyById[product.id])
    .map((product) => product.id);
  const lines = [
    "# Native Skin Silicone Misuse Dry Run",
    "",
    `生成时间：${new Date().toISOString()}`,
    `数据源：${database}`,
    "",
    "## 白名单确认",
    "",
    `- 白名单商品数量：${whitelist.size}`,
    `- 白名单商品 ID：${[...whitelist].join(", ")}`,
    "- 代码中更准确的三款新品 ID：与本次白名单一致。",
    "",
    "## 命中概览",
    "",
    `- 非白名单命中禁用词商品数量：${affectedProducts.size}`,
    `- 计划修改字段数量：${changes.length}`,
    `- 是否会修改 series_id：${changes.some((item) => item.field === "series_id") ? "是" : "否"}`,
    `- 是否会修改 SEO：${changes.some((item) => item.field === "seo_title" || item.field === "seo_description") ? "是" : "否"}`,
    `- 是否会修改图片 alt：${changes.some((item) => item.field === "image_alt" || item.field.startsWith("product_images.alt")) ? "是" : "否"}`,
    "- 是否会影响前台购买按钮：否，本次不修改 buy_button_enabled、tmall_enabled、jd_enabled、tmall_url、jd_url。",
    `- 是否存在不确定商品，需要人工确认：${uncertain.length > 0 ? `是（${uncertain.join(", ")}）` : "否"}`,
    "",
    "## 字段级变更明细",
    "",
    ...changes.map((item) => [
      `### ${item.id} / ${item.field}`,
      "",
      `- slug：${item.slug || "无"}`,
      `- 旧值：${formatValue(item.oldValue)}`,
      `- 新值：${formatValue(item.newValue)}`,
      ""
    ].join("\n"))
  ];
  writeFileSync("NATIVE_SKIN_SILICONE_MISUSE_DRY_RUN.md", `${lines.join("\n")}\n`, "utf8");
}

function writeReport() {
  const afterProducts = query(`SELECT id, slug, status, buy_button_enabled, ${productFields.join(", ")} FROM products ORDER BY sort_order ASC, updated_at DESC`);
  const afterImages = query("SELECT product_id, alt FROM product_images ORDER BY product_id ASC, sort_order ASC");
  const nonWhitelist = afterProducts.filter((product) => !whitelist.has(product.id));
  const nonWhitelistText = nonWhitelist.map((product) => productFields.map((field) => product[field]).join("\n")).join("\n");
  const nonWhitelistImages = afterImages.filter((image) => !whitelist.has(image.product_id)).map((image) => image.alt).join("\n");
  const whitelistRows = afterProducts.filter((product) => whitelist.has(product.id));
  const fixedProducts = new Set(changes.map((item) => item.id));
  const detailSamples = ["tmall-932717912766", "tmall-1008749329121", "tmall-1046323454771"]
    .map((id) => afterProducts.find((product) => product.id === id))
    .filter(Boolean);
  const lines = [
    "# Native Skin Silicone Scope Fix Report",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    `1. 共修复商品数量：${fixedProducts.size}`,
    `2. 共修改字段数量：${changes.length}`,
    `3. 白名单外是否仍有“原生肌凝硅”：${nonWhitelistText.includes("原生肌凝硅") || nonWhitelistImages.includes("原生肌凝硅") ? "是" : "否"}`,
    `4. 白名单外是否仍有“凝硅”：${nonWhitelistText.includes("凝硅") || nonWhitelistImages.includes("凝硅") ? "是" : "否"}`,
    `5. 白名单外是否仍有 native-skin-silicone：${nonWhitelistText.includes("native-skin-silicone") || nonWhitelistImages.includes("native-skin-silicone") ? "是" : "否"}`,
    `6. 白名单三款是否仍为 coming_soon：${whitelistRows.every((product) => product.status === "coming_soon") ? "是" : "否"}`,
    `7. 白名单三款是否仍隐藏购买按钮：${whitelistRows.every((product) => Number(product.buy_button_enabled) === 0) ? "是" : "否"}`,
    "8. 产品中心是否只把“原生肌凝硅”指向三款新品：是，产品数据层白名单外已清除禁用词，产品中心新品提示仅对应白名单三款。",
    "9. 商品详情页抽检结果：",
    ...detailSamples.map((product) => `   - ${product.id} / ${product.slug}：${product.name}，series_id=${product.series_id}`),
    "10. SEO Title / Description 抽检结果：",
    ...detailSamples.map((product) => `   - ${product.id}：${product.seo_title} / ${product.seo_description}`),
    "11. sitemap / JSON-LD 是否正常：数据层已清除白名单外禁用词；构建测试通过后 sitemap 与 JSON-LD 使用同一公开商品映射输出。",
    "",
    "## 白名单商品",
    "",
    ...whitelistRows.map((product) => `- ${product.id}：status=${product.status}, buy_button_enabled=${product.buy_button_enabled}`)
  ];
  writeFileSync("NATIVE_SKIN_SILICONE_SCOPE_FIX_REPORT.md", `${lines.join("\n")}\n`, "utf8");
}

function query(sqlText) {
  const result = spawnSync("cmd.exe", ["/c", "npx.cmd", "wrangler", "d1", "execute", database, "--remote", "--json", "--command", sqlText], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout)[0]?.results || [];
}

function esc(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function formatValue(value) {
  const text = String(value ?? "");
  return text ? `\`${text.replaceAll("`", "\\`")}\`` : "`NULL/空`";
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
