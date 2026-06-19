import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const database = getArg("--database") || "sweetmeilon-cms-prod";
const env = getArg("--env");
const shouldApply = process.argv.includes("--apply");
const remote = process.argv.includes("--remote");

const common = {
  care_notes:
    "建议按官方页面提示完成基础清洁与自然晾干，避免高温、暴晒和尖锐物接触。不同材质与款式的护理细节以官方渠道说明为准。",
  storage_notes:
    "清洁并完全干燥后单独收纳，尽量放置在阴凉干燥处，避免长期挤压、折叠或与深色织物直接接触。",
  privacy_notes:
    "官方渠道发货以隐私包装为基础，外包装不展示敏感商品信息；实际物流与售后规则以天猫商品页为准。",
  usage_tips:
    "首次了解时建议先对照尺寸、重量、材质和清洁方式，再根据自己的收纳空间与使用习惯选择款式。",
  compliance_notes:
    "页面仅作商品信息整理与品牌展示，不展示实时价格、库存、销量或优惠；购买与售后以官方渠道为准。",
  package_list:
    "商品主体、基础包装及随附配件以官方渠道实际页面和发货清单为准。"
};

const typeCopy = {
  halfFine: {
    summary: "围绕半身形态与细腻表面表现展开，适合关注轮廓比例、触感层次和日常收纳便利性的用户。",
    body:
      "这款半身造型产品以柔和曲线和稳定比例为主要表达，页面重点呈现形态、材质、清洁与隐私发货信息。它更适合希望先从半身款了解蜜女郎产品体系的用户，具体尺寸、重量和可选规格以官方渠道为准。",
    highlights: ["半身形态", "细腻纹理", "轮廓清晰", "隐私发货", "清洁说明完整"],
    material: "以官方渠道标注材质为准，官网侧重点展示触感方向、表面细节和日常护理注意事项。",
    specs: { 产品类型: "半身造型款", 风格方向: "细腻纹理", 购买渠道: "天猫官方旗舰店" }
  },
  halfSilicone: {
    summary: "以原生肌凝硅系列的柔感表达为核心，适合优先关注柔软回弹、表面细腻度和清洁便利性的用户。",
    body:
      "这款原生肌凝硅半身产品以柔和触感和干净的视觉轮廓为重点，适合对材质质感、回弹表现和收纳护理更在意的用户。页面不展示实时价格和库存，购买前可跳转官方渠道查看完整规格。",
    highlights: ["原生肌凝硅系列", "柔感触感", "半身轮廓", "收纳友好", "隐私包装"],
    material: "原生肌凝硅系列强调柔软、回弹与细腻表面体验，具体材质参数以官方商品页为准。",
    specs: { 产品类型: "半身造型款", 系列方向: "原生肌凝硅", 购买渠道: "天猫官方旗舰店" }
  },
  hipFine: {
    summary: "以臀部轮廓与细腻纹理表现为重点，适合关注形体线条、局部层次和视觉细节的用户。",
    body:
      "这款臀部造型产品重点呈现轮廓比例、弧线层次和表面细节，适合希望在产品中心快速区分臀部形态款式的用户。官网保留材质、护理、隐私发货和官方购买入口，具体规格以天猫页面为准。",
    highlights: ["臀部轮廓", "细腻纹理", "局部层次", "官方渠道", "隐私发货"],
    material: "材质与规格以官方渠道为准，官网文案侧重轮廓、触感方向和护理提醒。",
    specs: { 产品类型: "臀部造型款", 风格方向: "细腻纹理", 购买渠道: "天猫官方旗舰店" }
  },
  hipSilicone: {
    summary: "以原生肌凝硅系列的柔感材质和臀部轮廓为核心，适合关注柔软度、回弹感与局部形态的用户。",
    body:
      "这款原生肌凝硅臀部造型产品以柔感材质和圆润轮廓为重点，页面帮助用户先了解产品类型、材质方向、清洁收纳与隐私包装，再前往官方渠道确认完整规格。",
    highlights: ["原生肌凝硅系列", "臀部造型", "柔感回弹", "清洁护理", "官方渠道"],
    material: "原生肌凝硅系列强调柔软、回弹和细腻表面表现，具体参数以官方页面为准。",
    specs: { 产品类型: "臀部造型款", 系列方向: "原生肌凝硅", 购买渠道: "天猫官方旗舰店" }
  },
  automaticFine: {
    summary: "以自动体验和细腻纹理为核心卖点，适合希望优先比较功能配置、形态细节和官方购买入口的用户。",
    body:
      "这款自动系列产品适合在产品中心作为功能型款式进行查看。官网侧重说明产品类型、形态方向、护理方式与隐私发货，不展示实时价格、销量或库存，具体配置以官方渠道为准。",
    highlights: ["自动系列", "细腻纹理", "功能配置", "官方渠道", "隐私发货"],
    material: "材质、功能配置和可选版本以官方商品页为准，官网仅作稳定信息整理。",
    specs: { 产品类型: "自动体验款", 风格方向: "细腻纹理", 购买渠道: "天猫官方旗舰店" }
  },
  automaticSilicone: {
    summary: "结合自动系列配置与原生肌凝硅材质方向，适合关注功能体验、柔感触感和护理便利性的用户。",
    body:
      "这款原生肌凝硅自动系列产品以功能配置和柔感材质为主要识别点。官网页面用于展示稳定的产品信息、清洁收纳提醒与官方购买入口，完整规格仍以天猫官方页面为准。",
    highlights: ["自动系列", "原生肌凝硅", "柔感触感", "护理提醒", "官方渠道"],
    material: "原生肌凝硅系列强调柔感和回弹表现，自动配置与版本差异以官方商品页为准。",
    specs: { 产品类型: "自动体验款", 系列方向: "原生肌凝硅", 购买渠道: "天猫官方旗舰店" }
  },
  localSilicone: {
    summary: "以原生肌凝硅材质和局部造型细节为重点，适合关注触感、细节表现和便于收纳的用户。",
    body:
      "这款局部造型产品适合希望从更轻量的款式了解蜜女郎材质体系的用户。页面重点呈现材质方向、形态识别、清洁收纳和隐私发货信息，具体规格以官方渠道为准。",
    highlights: ["局部造型", "原生肌凝硅", "轻量收纳", "清洁便利", "隐私包装"],
    material: "材质以官方页面标注为准，官网侧重表达柔感方向与日常护理注意事项。",
    specs: { 产品类型: "局部造型款", 系列方向: "原生肌凝硅", 购买渠道: "天猫官方旗舰店" }
  },
  accessory: {
    summary: "面向日常清洁、收纳和隐私管理的护理配件，适合与半身或局部产品搭配查看。",
    body:
      "这款护理收纳配件用于帮助用户更好地完成日常整理、收纳与隐私管理。官网页面仅展示稳定的功能信息和官方渠道入口，具体尺寸、适配范围和发货清单以天猫页面为准。",
    highlights: ["护理收纳", "隐私管理", "搭配使用", "官方渠道", "日常整理"],
    material: "配件材质、尺寸和适配范围以官方商品页为准。",
    specs: { 产品类型: "护理收纳配件", 使用方向: "清洁与收纳", 购买渠道: "天猫官方旗舰店" }
  }
};

const updates = [
  item("tmall-915657112223", "细腻纹理自动臀部款", "自动臀部款", "自动系列 · 臀部轮廓 · 细腻纹理", "automaticFine"),
  item("tmall-856316241725", "细腻纹理半身造型款", "半身造型款", "半身形态 · 细腻纹理 · 官方在售", "halfFine"),
  item("tmall-932717912766", "原生肌凝硅半身柔感款", "凝硅半身款", "原生肌凝硅 · 半身轮廓 · 柔感系列", "halfSilicone"),
  item("tmall-1034711994048", "原生肌凝硅长腿半身款", "长腿半身款", "原生肌凝硅 · 半身长腿方向", "halfSilicone"),
  item("tmall-907956953396", "细腻纹理臀部造型款", "臀部造型款", "臀部轮廓 · 细腻纹理 · 官方在售", "hipFine"),
  item("tmall-848996196197", "轻盈比例半身造型款", "轻盈半身款", "半身形态 · 轻盈比例 · 细腻纹理", "halfFine"),
  item("tmall-1055031288751", "柔和曲线半身造型款", "曲线半身款", "半身形态 · 柔和曲线 · 细腻纹理", "halfFine"),
  item("tmall-1003179680764", "原生肌凝硅全腿半身款", "全腿半身款", "原生肌凝硅 · 全腿半身方向", "halfSilicone"),
  item("tmall-1033146604001", "原生肌凝硅半身基础款", "凝硅基础款", "原生肌凝硅 · 半身基础方向", "halfSilicone"),
  item("tmall-1008749329121", "原生肌凝硅臀部柔感款", "凝硅臀部款", "原生肌凝硅 · 臀部轮廓 · 柔感系列", "hipSilicone"),
  item("tmall-978357698377", "原生肌凝硅半身细节款", "凝硅细节款", "原生肌凝硅 · 半身细节方向", "halfSilicone"),
  item("tmall-1037741386848", "原生肌凝硅半身典藏款", "凝硅典藏款", "原生肌凝硅 · 半身典藏方向", "halfSilicone"),
  item("tmall-903284452343", "细腻纹理自动臀部进阶款", "自动进阶款", "自动系列 · 臀部轮廓 · 进阶方向", "automaticFine"),
  item("tmall-974064324737", "安心入门自动体验款", "自动入门款", "入门系列 · 自动体验 · 官方在售", "automaticFine"),
  item("tmall-1015501179254", "原生肌凝硅局部造型款", "凝硅局部款", "原生肌凝硅 · 局部造型 · 轻量收纳", "localSilicone"),
  item("tmall-1049922662436", "原生肌凝硅半身静奢款", "凝硅静奢款", "原生肌凝硅 · 半身柔感方向", "halfSilicone"),
  item("tmall-1032948274589", "臀部线条半身造型款", "臀线半身款", "半身形态 · 臀部线条 · 细腻纹理", "halfFine"),
  item("tmall-900429175999", "臀部轮廓半身造型款", "臀部半身款", "半身形态 · 臀部轮廓 · 官方在售", "halfFine"),
  item("tmall-851429867792", "隐私收纳护理配件", "护理收纳", "护理配件 · 隐私收纳 · 日常整理", "accessory"),
  item("tmall-956711010507", "原生肌凝硅半身柔弧款", "凝硅柔弧款", "原生肌凝硅 · 半身柔弧方向", "halfSilicone"),
  item("tmall-1047503838777", "原生肌凝硅臀线半身款", "凝硅臀线款", "原生肌凝硅 · 臀线半身方向", "halfSilicone"),
  item("tmall-1046323454771", "原生肌凝硅自动半身款", "凝硅自动款", "原生肌凝硅 · 自动系列 · 半身方向", "automaticSilicone"),
  item("tmall-935751348502", "便携自动入门款", "便携自动款", "入门系列 · 便携自动 · 官方在售", "automaticFine"),
  item("tmall-839593996256", "原生肌凝硅自动臀部款", "凝硅自动臀部", "原生肌凝硅 · 自动系列 · 臀部轮廓", "automaticSilicone"),
  item("tmall-1026704244735", "原生肌凝硅高端半身款", "凝硅高端款", "原生肌凝硅 · 高端半身方向", "halfSilicone"),
  item("tmall-1037064556812", "细腻纹理自动体验款", "自动体验款", "细腻纹理 · 自动系列 · 官方在售", "automaticFine"),
  item("tmall-966709910145", "原生肌凝硅半身精选款", "凝硅精选款", "原生肌凝硅 · 半身精选方向", "halfSilicone")
];

function item(id, name, shortName, subtitle, type) {
  return { id, name, shortName, subtitle, type };
}

function buildCopy(update) {
  const copy = typeCopy[update.type];
  const title = `${update.name} | 蜜女郎 SWEETMEILON`;
  const description = `${update.name}，${copy.summary} 支持跳转官方渠道查看规格、价格、发货和售后信息。`;
  return {
    ...update,
    summary: copy.summary,
    body_html: `<p>${copy.body}</p><p>本页保留官方渠道入口，具体规格、价格、库存、优惠和售后以天猫商品页为准。</p>`,
    highlights_json: JSON.stringify(copy.highlights),
    material_notes: copy.material,
    specifications_json: JSON.stringify(copy.specs),
    seo_title: title,
    seo_description: description,
    image_alt: `${update.name}产品图`
  };
}

function esc(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlFor(update) {
  const copy = buildCopy(update);
  const assignments = [
    ["name", copy.name],
    ["short_name", copy.shortName],
    ["subtitle", copy.subtitle],
    ["summary", copy.summary],
    ["body_html", copy.body_html],
    ["highlights_json", copy.highlights_json],
    ["material_notes", copy.material_notes],
    ["specifications_json", copy.specifications_json],
    ["package_list", common.package_list],
    ["care_notes", common.care_notes],
    ["storage_notes", common.storage_notes],
    ["privacy_notes", common.privacy_notes],
    ["usage_tips", common.usage_tips],
    ["compliance_notes", common.compliance_notes],
    ["image_alt", copy.image_alt],
    ["seo_title", copy.seo_title],
    ["seo_description", copy.seo_description],
    ["updated_at", new Date().toISOString()]
  ];
  return `UPDATE products SET ${assignments.map(([key, value]) => `${key} = ${esc(value)}`).join(", ")} WHERE id = ${esc(copy.id)} AND summary LIKE '该商品已同步官方旗舰店入口%';`;
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const sql = updates.map(sqlFor).join("\n");

if (!shouldApply) {
  console.log(sql);
  console.log(`\nPrepared ${updates.length} product copy updates. Add --apply to execute.`);
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "sweetmeilon-copy-"));
const file = join(dir, "product-copy.sql");
writeFileSync(file, `${sql}\n`, "utf8");

const args = ["wrangler", "d1", "execute", database, "--file", file];
if (env) args.push("--env", env);
if (remote) args.push("--remote");

const result = spawnSync("npx.cmd", args, { stdio: "inherit", shell: true });
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
