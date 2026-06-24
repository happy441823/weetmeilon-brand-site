import { getPublicCmsItem, readPublicCmsRows } from "@/lib/cms/public-content";
import { sanitizeHtml } from "@/lib/cms/content-security";

export type ArticleStatus = "published" | "draft";

export type ArticleSection = {
  heading: string;
  body: string[];
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  outline: string[];
  sections: ArticleSection[];
  readMinutes: number;
  status: ArticleStatus;
  indexable: boolean;
  renderedHtml?: string;
};

const defaultDraftSections: ArticleSection[] = [
  {
    heading: "先确认这篇内容适合解决什么问题",
    body: [
      "这篇草稿用于帮助用户在购买前建立判断顺序：先理解材质和产品类型，再确认隐私购买、清洁保养与官方旗舰店入口。它不替代具体商品页，也不展示交易动态或平台活动信息。",
      "审核时请重点检查表述是否克制、是否避免夸大体验，以及是否把需要实时确认的信息交回官方旗舰店页面。"
    ]
  },
  {
    heading: "材质、清洁与隐私是购买前的三条主线",
    body: [
      "材质信息应以具体商品说明为准。官网可以解释品牌材质概念、触感方向和日常维护思路，但不能把概念包装成医疗功效、第三方认证或无法验证的承诺。",
      "清洁与收纳需要结合商品结构阅读。隐私购买则要关注包装、面单、物流通知和售后沟通方式，具体规则以天猫或京东官方旗舰店页面及客服说明为准。"
    ]
  },
  {
    heading: "相关入口建议",
    body: [
      "可在正文中关联产品中心 /products、清洁指南 /guide、隐私购买 /privacy-shipping、FAQ /faq，以及对应分类页面，帮助用户在官网内完成购买前的信息确认。",
      "如果涉及具体商品，只描述公开稳定的信息，并提醒用户进入官方旗舰店确认规格、发货、物流和售后。"
    ]
  },
  {
    heading: "常见问题",
    body: [
      "问：官网为什么不展示交易动态信息？答：官网保留稳定的品牌、材质和护理说明，具体规格、发货、物流与售后以官方旗舰店页面为准。",
      "问：新品预告可以直接购买吗？答：新品预告暂未开放官网购买入口，正式商品信息以上架后的官方旗舰店页面为准。",
      "问：材质说明以哪里为准？答：官网解释品牌材质概念，具体商品材质和使用说明以商品详情页为准。"
    ]
  },
  {
    heading: "审核边界",
    body: [
      "发布前请确认 SEO Title、SEO Description、canonical、相关商品或分类内链已经补齐，并确认正文没有高风险词堆砌、交易动态数据或无法验证的承诺。",
      "通过人工审核后再发布；未审核前保持 draft 或 pending_review，不进入 sitemap。"
    ]
  }
];

export const articles: Article[] = [
  {
    slug: "native-skin-silicone-meaning",
    title: "原生肌凝硅是什么：从柔软、回弹与细腻表面理解材质体验",
    category: "材质体验",
    description: "从柔软、回弹、细腻表面与日常清洁角度，理解蜜女郎的品牌材质概念。",
    keywords: ["原生肌凝硅", "材质体验", "柔软回弹"],
    outline: ["原生肌凝硅是什么", "柔软、回弹与细腻分别指什么", "如何结合商品说明理解材质", "购买前还需要确认哪些信息"],
    sections: [
      {
        heading: "它首先是品牌材质体验概念",
        body: [
          "原生肌凝硅用于表达蜜女郎对柔软质感、稳定回弹和细腻表面的整体追求。它更适合作为购买前理解体验方向的概念入口，而不是替代具体商品页里的材质参数、规格尺寸或使用说明。",
          "不同商品的结构、厚度、表面处理和使用方式都会影响实际感受。浏览官网时，可以先用这个概念建立判断框架，再回到官方旗舰店页面确认对应商品的完整信息。"
        ]
      },
      {
        heading: "柔软、回弹和细腻分别看什么",
        body: [
          "柔软通常指接触时的第一感受，重点是是否亲肤、是否有足够的包裹感。回弹关注受力后的恢复表现，过软或过硬都会影响稳定性。细腻表面则更多体现在纹理、边缘过渡和光泽层次上。",
          "这些维度没有单一标准答案。更稳妥的做法是结合自己的清洁习惯、收纳条件和对触感的偏好，选择更适合日常维护的产品类型。"
        ]
      },
      {
        heading: "购买前仍要回到商品页确认",
        body: [
          "官网不会展示交易动态或平台活动标签。实际购买前，请以天猫或京东官方旗舰店页面为准，确认商品标题、规格、包装清单、清洁方式、发货规则和售后说明。",
          "如果你对材质敏感、清洁方式或收纳空间有特别要求，建议先阅读商品说明，再咨询官方客服。"
        ]
      }
    ],
    readMinutes: 4,
    status: "published",
    indexable: true
  },
  {
    slug: "how-to-choose-three-products",
    title: "三款系列怎么选：从触感偏好、清洁习惯和隐私需求出发",
    category: "产品选择",
    description: "从材质触感、表面细节、隐私需求与清洁习惯出发，比较三款系列。",
    keywords: ["三款系列怎么选", "产品选择", "隐私需求"],
    outline: ["先确认最在意的关注点", "柔感、质感与入门系列的区别", "清洁习惯如何影响选择", "进入官方旗舰店前确认具体规格"],
    sections: defaultDraftSections,
    readMinutes: 5,
    status: "draft",
    indexable: false
  },
  {
    slug: "privacy-shipping-guide",
    title: "隐私购买与收货提示：包装、面单与收货时需要注意什么",
    category: "隐私购买",
    description: "购买前先了解包装、面单、配送通知与售后沟通中的隐私注意事项。",
    keywords: ["隐私购买", "隐私包装", "官方旗舰店"],
    outline: ["隐私购买通常关注哪些细节", "下单前查看旗舰店哪些说明", "收货地址和物流通知怎么安排", "售后沟通时如何保护个人信息"],
    sections: [
      {
        heading: "先确认包装与面单说明",
        body: [
          "私密用品购买前，很多人最关心的是外包装、面单展示和物流通知。官网可以提供通用提醒，但具体包装方式、发货规则和面单信息，仍要以天猫或京东官方旗舰店页面及客服说明为准。",
          "下单前建议查看商品详情页、店铺服务说明和购买须知。如果页面信息不够明确，再通过官方客服确认，避免只根据经验或第三方说法判断。"
        ]
      },
      {
        heading: "收货安排要减少额外暴露",
        body: [
          "尽量选择本人方便接收的地址，留意平台物流通知和取件方式。如果使用驿站、公司地址或共享收货点，需要考虑短信、电话、包裹暂存和他人代收带来的信息可见性。",
          "如果对隐私要求较高，可以在下单前咨询是否支持更适合自己的收货方式。不要在非官方渠道透露订单号、联系方式或详细地址。"
        ]
      },
      {
        heading: "售后沟通也需要注意个人信息",
        body: [
          "售后沟通建议优先在官方旗舰店平台内完成，便于保留记录，也能减少个人信息分散在多个渠道。沟通时只提供处理问题所需的信息，不主动发送无关的身份证明、地址截图或聊天记录。",
          "官网不直接处理订单、发货和售后。涉及退款、换货、物流异常和发票等问题，应以对应平台和官方旗舰店规则为准。"
        ]
      }
    ],
    readMinutes: 4,
    status: "published",
    indexable: true
  },
  {
    slug: "cleaning-and-storage-basics",
    title: "硅胶产品清洁保养基础：使用前后、晾干与单独收纳",
    category: "清洁保养",
    description: "用基础、清楚的方式说明使用前后清洁、充分晾干与单独收纳。",
    keywords: ["清洁保养", "晾干收纳", "硅胶产品"],
    outline: ["使用前为什么需要先阅读说明", "使用后如何温和清洁", "为什么要充分晾干", "长期收纳需要注意什么"],
    sections: [
      {
        heading: "先看商品说明，再开始清洁",
        body: [
          "不同产品在结构、开口、表面纹理和配件上可能不同，清洁方式也会有差异。第一次使用前，应先阅读官方旗舰店商品说明、包装说明或随附指南，确认是否有禁用清洁剂、温度限制或特殊部位处理要求。",
          "官网提供的是基础保养思路，不替代具体商品说明。如果说明之间存在差异，以你购买商品的官方说明为准。"
        ]
      },
      {
        heading: "使用后温和清洁并充分晾干",
        body: [
          "一般情况下，使用后应尽快清洁，避免残留物长时间停留。清洁时保持动作温和，避免用尖锐工具刮擦表面，也不要使用不确定是否适合材质的强刺激清洁剂。",
          "清洁后要充分晾干，再进行收纳。潮湿状态下直接密闭存放，可能影响气味、表面状态和后续使用体验。"
        ]
      },
      {
        heading: "单独收纳并定期检查",
        body: [
          "收纳时建议单独放置，避免与易掉色、易粘附或尖锐物品长期接触。放在阴凉、干燥、避光的位置，有助于维持更稳定的日常状态。",
          "定期查看表面是否有破损、变色、粘附异常或异味。如果发现明显异常，应暂停使用，并咨询官方客服或查看商品说明中的处理建议。"
        ]
      }
    ],
    readMinutes: 4,
    status: "published",
    indexable: true
  },
  {
    slug: "official-site-to-tmall",
    title: "为什么官网只做介绍，购买仍在官方旗舰店完成",
    category: "官方渠道",
    description: "说明官网与天猫、京东官方旗舰店的分工，帮助购买前先看清楚信息。",
    keywords: ["蜜女郎官网", "天猫旗舰店", "京东旗舰店"],
    outline: ["官网主要提供哪些信息", "官方旗舰店提供哪些购买服务", "交易与售后为什么以平台为准", "如何选择天猫或京东入口"],
    sections: defaultDraftSections,
    readMinutes: 3,
    status: "draft",
    indexable: false
  },
  {
    slug: "material-photo-checklist",
    title: "看产品图时看什么：表面细节、边缘过渡与整体质感",
    category: "材质体验",
    description: "查看产品图时，可以先关注表面细节、边缘过渡、光泽和整体质感。",
    keywords: ["产品图怎么看", "材质细节", "整体质感"],
    outline: ["先看表面是否细腻均匀", "再看边缘过渡是否自然", "关注光泽和纹理层次", "结合清洁说明一起判断"],
    sections: defaultDraftSections,
    readMinutes: 4,
    status: "draft",
    indexable: false
  },
  {
    slug: "beginner-buying-questions",
    title: "第一次购买前，建议先确认材质、隐私、清洁和官方渠道",
    category: "购买前确认",
    description: "第一次了解前，可以先把材质、隐私、清洁和官方购买渠道确认清楚。",
    keywords: ["第一次购买", "购买前确认", "蜜女郎"],
    outline: ["材质体验应该怎么看", "隐私发货需要确认什么", "清洁收纳有哪些基础动作", "官方购买渠道在哪里"],
    sections: defaultDraftSections,
    readMinutes: 5,
    status: "draft",
    indexable: false
  },
  {
    slug: "new-product-native-skin-silicone",
    title: "原生肌凝硅系列怎么选：柔软、回弹与表面细节的区别",
    category: "产品选择",
    description: "围绕柔软、回弹与表面细节，理解原生肌凝硅系列的选择方向。",
    keywords: ["原生肌凝硅系列", "柔软回弹", "表面细节"],
    outline: ["柔软体验适合关注什么", "回弹表现如何理解", "表面细节怎么看", "结合具体商品规格做选择"],
    sections: defaultDraftSections,
    readMinutes: 4,
    status: "draft",
    indexable: false
  },
  {
    slug: "product-info-before-buying",
    title: "购买成人用品时，哪些商品信息值得先确认",
    category: "购买前确认",
    description: "购买前先确认规格、材质说明、包装、物流和售后信息，可以让选择更清楚。",
    keywords: ["商品信息", "购买前确认", "官方旗舰店"],
    outline: ["先看规格和材质说明", "确认包装和发货规则", "查看清洁与收纳建议", "发货与售后以旗舰店为准"],
    sections: defaultDraftSections,
    readMinutes: 4,
    status: "draft",
    indexable: false
  },
  {
    slug: "weekly-care-routine",
    title: "日常维护清单：清洁、晾干、收纳与定期检查",
    category: "清洁保养",
    description: "用简单清单整理清洁、晾干、单独收纳和定期检查的日常维护动作。",
    keywords: ["日常维护", "清洁收纳", "定期检查"],
    outline: ["每次使用后的基础动作", "充分晾干后再收纳", "单独收纳和避光放置", "定期查看表面状态"],
    sections: defaultDraftSections,
    readMinutes: 4,
    status: "draft",
    indexable: false
  }
];

export const publishedArticles = articles.filter((article) => article.status === "published" && article.indexable);

function escapeHtml(input: unknown) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseJsonArray(value: unknown) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function renderArticleContentBlocksToHtml(value: unknown) {
  const blocks = parseJsonArray(value);
  const html = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const item = block as Record<string, unknown>;
      const type = String(item.type || "");
      if (type === "paragraph") return `<p>${escapeHtml(item.text)}</p>`;
      if (type === "heading") {
        const level = [2, 3, 4].includes(Number(item.level)) ? Number(item.level) : 2;
        return `<h${level}>${escapeHtml(item.text)}</h${level}>`;
      }
      if (type === "quote") return `<blockquote><p>${escapeHtml(item.text)}</p>${item.cite ? `<figcaption>${escapeHtml(item.cite)}</figcaption>` : ""}</blockquote>`;
      if (type === "cta") return `<p><a class="cms-cta" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></p>`;
      if (type === "product_card") return `<p class="cms-product-card">关联商品：${escapeHtml(item.product_id)}</p>`;
      if (type === "table" && Array.isArray(item.rows)) {
        const rows = item.rows
          .filter((row) => Array.isArray(row))
          .map((row) => `<tr>${(row as unknown[]).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("");
        return rows ? `<table><tbody>${rows}</tbody></table>` : "";
      }
      return "";
    })
    .join("");
  return sanitizeHtml(html);
}

export function articleFromCms(row: Record<string, unknown>): Article {
  const renderedHtml = sanitizeHtml(row.body_html || "") || renderArticleContentBlocksToHtml(row.content_blocks_json);
  const body = stripHtml(renderedHtml);
  const keywords = (() => {
    try {
      const parsed = JSON.parse(String(row.keywords_json || "[]"));
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  })();

  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    category: String(row.category_name || "内容"),
    description: String(row.excerpt || row.seo_description || ""),
    keywords,
    outline: [],
    sections: body ? [{ heading: "正文", body: [body] }] : [],
    readMinutes: Math.max(1, Math.ceil(body.length / 500)),
    status: "published",
    indexable: row.indexable !== 0,
    renderedHtml
  };
}

export async function getPublishedArticles() {
  const result = await readPublicCmsRows<Record<string, unknown>>("articles");
  const cmsArticles = result.rows.map(articleFromCms).filter((article) => article.slug && article.title && article.indexable);
  return cmsArticles.length > 0 ? cmsArticles : publishedArticles;
}

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getPublishedArticle(slug: string) {
  return publishedArticles.find((article) => article.slug === slug);
}

export async function getPublishedArticleBySlug(slug: string) {
  const cmsArticle = await getPublicCmsItem<Record<string, unknown>>("articles", "slug", slug);
  if (cmsArticle) {
    const article = articleFromCms(cmsArticle);
    if (article.slug && article.title && article.indexable) {
      return article;
    }
  }
  return getPublishedArticle(slug);
}
