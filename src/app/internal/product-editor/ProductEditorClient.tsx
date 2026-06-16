"use client";

import { useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct, CatalogSeries, ProductStatus } from "@/types/catalog";

type ProductEditorClientProps = {
  categories: CatalogCategory[];
  series: CatalogSeries[];
  existingProducts: { id: string; slug: string }[];
};

type FormState = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  primaryCategoryId: string;
  subcategoryId: string;
  seriesId: string;
  tags: string;
  status: ProductStatus;
  visible: boolean;
  featured: boolean;
  sortOrder: string;
  coverImage: string;
  gallery: string;
  imageAlt: string;
  shortDescription: string;
  fullDescription: string;
  highlights: string;
  specifications: string;
  careNotes: string;
  privacyNotes: string;
  tmallUrl: string;
  jdUrl: string;
};

const initialState: FormState = {
  id: "",
  slug: "",
  name: "",
  shortName: "",
  subtitle: "",
  primaryCategoryId: "tpe-mold",
  subcategoryId: "",
  seriesId: "",
  tags: "",
  status: "draft",
  visible: false,
  featured: false,
  sortOrder: "500",
  coverImage: "",
  gallery: "",
  imageAlt: "",
  shortDescription: "",
  fullDescription: "",
  highlights: "",
  specifications: "",
  careNotes: "使用前后按商品说明进行清洁。\n充分晾干后单独收纳。",
  privacyNotes: "包装、面单与配送规则以官方旗舰店页面和客服说明为准。",
  tmallUrl: "",
  jdUrl: ""
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string) {
  return splitLines(value).map((line) => {
    const [label, ...rest] = line.split(/[:：]/);
    return {
      label: label.trim(),
      value: rest.join(":").trim()
    };
  }).filter((item) => item.label && item.value);
}

function isValidUrl(value: string, channel: "tmall" | "jd") {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }
    return channel === "tmall"
      ? url.hostname.endsWith("tmall.com") || url.hostname.endsWith("taobao.com")
      : url.hostname.endsWith("jd.com");
  } catch {
    return false;
  }
}

function downloadText(filename: string, text: string, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProductEditorClient({ categories, series, existingProducts }: ProductEditorClientProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const primaryCategories = categories.filter((item) => item.level === "primary");
  const subcategories = categories.filter((item) => item.level === "secondary" && item.parentId === form.primaryCategoryId);

  const product = useMemo(() => {
    const now = new Date().toISOString();
    const hasTmall = Boolean(form.tmallUrl.trim());
    const hasJd = Boolean(form.jdUrl.trim());
    const verified = form.status === "active";

    return {
      id: form.id.trim(),
      slug: form.slug.trim(),
      skuCode: form.id.trim().toUpperCase(),
      name: form.name.trim(),
      shortName: form.shortName.trim() || form.name.trim(),
      subtitle: form.subtitle.trim(),
      categoryId: form.primaryCategoryId,
      primaryCategoryId: form.primaryCategoryId,
      subcategoryId: form.subcategoryId || null,
      categoryReviewStatus: form.status === "active" ? "confirmed" : "needs-review",
      seriesId: form.seriesId || null,
      tags: splitTags(form.tags),
      status: form.status,
      visible: form.visible,
      featured: form.featured,
      sortOrder: Number(form.sortOrder) || 500,
      launchDate: null,
      coverImage: form.coverImage.trim(),
      gallery: splitLines(form.gallery),
      imageAlt: form.imageAlt.trim() || `${form.name.trim()}官网商品主图`,
      imageTag: form.status === "active" ? "官网主图" : "新品预告",
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim() || form.shortDescription.trim(),
      heroLine: form.subtitle.trim() || form.shortDescription.trim(),
      bestFor: [],
      highlights: splitLines(form.highlights),
      specifications: parseSpecifications(form.specifications),
      careNotes: splitLines(form.careNotes),
      privacyNotes: splitLines(form.privacyNotes),
      channelLinks: {
        tmall: {
          enabled: form.status === "active" && hasTmall,
          url: hasTmall ? form.tmallUrl.trim() : null,
          label: "查看天猫同款",
          verified: verified && hasTmall,
          sourceUrl: hasTmall ? form.tmallUrl.trim() : null,
          lastCheckedAt: verified && hasTmall ? now : null
        },
        jd: {
          enabled: form.status === "active" && hasJd,
          url: hasJd ? form.jdUrl.trim() : null,
          label: "查看京东同款",
          verified: verified && hasJd,
          sourceUrl: hasJd ? form.jdUrl.trim() : null,
          lastCheckedAt: verified && hasJd ? now : null
        }
      },
      sourceRecords: [],
      verificationStatus: form.status === "active" ? "verified" : "needs_review",
      publishReady: form.status === "active" && form.visible,
      publishIssues: [],
      imageStatus: form.coverImage ? "ready" : "missing",
      linkStatus: form.status === "active" && (hasTmall || hasJd) ? "verified" : "missing",
      contentStatus: form.status === "active" ? "ready" : "needs-review",
      visualAssetStatus: form.coverImage ? "ready" : "pending",
      manualReviewed: form.status === "active",
      reviewedAt: form.status === "active" ? now : null,
      reviewedBy: form.status === "active" ? "merchant" : null,
      assetWorkflowStatus: form.coverImage ? "ready" : "waiting_user_assets",
      seoTitle: `${form.name.trim()}｜蜜女郎官方商品`,
      seoDescription: form.shortDescription.trim(),
      seoKeywords: ["蜜女郎", ...splitTags(form.tags)].slice(0, 6),
      createdAt: now,
      updatedAt: now
    } satisfies CatalogProduct;
  }, [form]);

  const problems = useMemo(() => {
    const errors: string[] = [];
    const ids = new Set(existingProducts.map((item) => item.id));
    const slugs = new Set(existingProducts.map((item) => item.slug));

    if (!form.id.trim()) errors.push("缺少商品 ID");
    if (!form.slug.trim()) errors.push("缺少 slug");
    if (!form.name.trim()) errors.push("缺少商品名称");
    if (!form.shortDescription.trim()) errors.push("缺少简短说明");
    if (ids.has(form.id.trim())) errors.push("商品 ID 已存在");
    if (slugs.has(form.slug.trim())) errors.push("slug 已存在");
    if (!primaryCategories.some((item) => item.id === form.primaryCategoryId)) errors.push("一级分类不存在");
    if (form.subcategoryId && !subcategories.some((item) => item.id === form.subcategoryId)) errors.push("二级分类不存在或不属于当前一级分类");
    if (!isValidUrl(form.tmallUrl, "tmall")) errors.push("天猫链接格式不正确");
    if (!isValidUrl(form.jdUrl, "jd")) errors.push("京东链接格式不正确");
    if (form.status === "active" && !form.tmallUrl.trim() && !form.jdUrl.trim()) errors.push("active 商品必须填写天猫或京东链接");
    if (form.status === "active" && !form.coverImage.trim()) errors.push("active 商品必须填写主图路径");
    if (form.status === "upcoming" && (form.tmallUrl.trim() || form.jdUrl.trim())) errors.push("upcoming 商品不能填写购买链接");

    return errors;
  }, [existingProducts, form, primaryCategories, subcategories]);

  const jsonText = JSON.stringify(product, null, 2);
  const tsText = `  ${JSON.stringify(product, null, 2).replace(/^/gm, "  ").trim()},`;
  const checklistText = [
    `商品名称：${form.name}`,
    `商品 ID：${form.id}`,
    `主图目录：public/images/products/${form.id}/approved/`,
    `主图路径：${form.coverImage}`,
    `天猫链接：${form.tmallUrl || "未填写"}`,
    `京东链接：${form.jdUrl || "未填写"}`,
    "上线前检查：catalog:validate、catalog:check-links、catalog:check-images、lint、build"
  ].join("\n");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
        {([
          ["id", "商品 ID", "tmall-123456789"],
          ["slug", "页面 slug", "tpe-hip-mold-123456789"],
          ["name", "商品名称", "官网展示名称"],
          ["shortName", "短名称", "列表短名称"],
          ["subtitle", "产品定位", "立体仿真美臀"],
          ["tags", "标签", "每行或逗号分隔"],
          ["coverImage", "主图路径", "/images/products/tmall-123456789/approved/cover.webp"],
          ["imageAlt", "图片说明", "蜜女郎某某商品主图"],
          ["tmallUrl", "天猫链接", "https://detail.tmall.com/item.htm?id=..."],
          ["jdUrl", "京东链接", "https://item.jd.com/..."]
        ] as const).map(([key, label, placeholder]) => (
          <label key={key} className="grid gap-2">
            <span className="text-sm font-black text-white">{label}</span>
            <input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none placeholder:text-white/32" />
          </label>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">一级分类</span>
            <select value={form.primaryCategoryId} onChange={(event) => update("primaryCategoryId", event.target.value)} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none">
              {primaryCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">二级分类</span>
            <select value={form.subcategoryId} onChange={(event) => update("subcategoryId", event.target.value)} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none">
              <option value="">暂不选择</option>
              {subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">产品系列</span>
            <select value={form.seriesId} onChange={(event) => update("seriesId", event.target.value)} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none">
              <option value="">无</option>
              {series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">状态</span>
            <select value={form.status} onChange={(event) => update("status", event.target.value as ProductStatus)} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none">
              <option value="draft">draft</option>
              <option value="upcoming">upcoming</option>
              <option value="active">active</option>
              <option value="discontinued">discontinued</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">排序</span>
            <input value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} className="focus-ring h-11 rounded-xl border border-white/12 bg-[#160722]/80 px-3 text-sm text-white outline-none" />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-bold text-white/76">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.visible} onChange={(event) => update("visible", event.target.checked)} />公开可见</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} />首页推荐</label>
        </div>

        {([
          ["shortDescription", "简短说明"],
          ["fullDescription", "详细说明"],
          ["highlights", "产品特点"],
          ["specifications", "规格，每行：名称：内容"],
          ["careNotes", "清洁说明"],
          ["privacyNotes", "隐私说明"],
          ["gallery", "详情图路径"]
        ] as const).map(([key, label]) => (
          <label key={key} className="grid gap-2">
            <span className="text-sm font-black text-white">{label}</span>
            <textarea value={form[key]} onChange={(event) => update(key, event.target.value)} rows={key === "fullDescription" ? 5 : 3} className="focus-ring resize-none rounded-xl border border-white/12 bg-[#160722]/80 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/32" />
          </label>
        ))}
      </form>

      <aside className="grid gap-4 content-start">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-xl font-black text-white">实时检查</h2>
          {problems.length > 0 ? (
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-rose-200">
              {problems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-bold text-mint-300">当前表单未发现明显问题。</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => downloadText(`${product.id || "product"}.json`, jsonText)} className="focus-ring rounded-full bg-mint-gradient px-4 py-2 text-sm font-black text-plum-950">下载 JSON</button>
            <button type="button" onClick={() => navigator.clipboard.writeText(tsText)} className="focus-ring rounded-full border border-white/14 px-4 py-2 text-sm font-bold text-white">复制 TS 数据</button>
            <button type="button" onClick={() => downloadText(`${product.id || "product"}-checklist.txt`, checklistText, "text/plain")} className="focus-ring rounded-full border border-white/14 px-4 py-2 text-sm font-bold text-white">下载资料清单</button>
          </div>
        </section>
        <section className="rounded-[28px] border border-white/10 bg-[#100019]/70 p-5">
          <h2 className="text-xl font-black text-white">JSON 预览</h2>
          <pre className="mt-4 max-h-[680px] overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-5 text-aura/80">{jsonText}</pre>
        </section>
      </aside>
    </div>
  );
}
