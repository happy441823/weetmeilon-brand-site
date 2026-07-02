"use client";

import { useMemo, useState, useTransition } from "react";

type PreviewItem = {
  sourceUrl: string;
  platform: string;
  sourceProductId: string | null;
  titleDetected: string;
  authorized: boolean;
  errors: string[];
  metadata?: {
    imageUrls?: string[];
    sourceShopName?: string;
  } | null;
  draft?: {
    productId: string | null;
    slug: string;
    name: string;
    summary: string;
    status: "draft";
    indexable: false;
    buyButtonEnabled: false;
    visibleCatalog: false;
    galleryJson: string[];
    primaryCategoryId: string;
    subcategoryId: string;
    seriesId: string;
  } | null;
};

type CreatedJob = {
  id: string;
  sourceUrl: string;
};

const primaryOptions = [
  { value: "intimate-molds", label: "阴臀倒模" },
  { value: "realistic-dolls", label: "实体娃娃" },
  { value: "masturbator-cups", label: "飞机杯" }
];

const subcategoryOptions: Record<string, { value: string; label: string }[]> = {
  "intimate-molds": [
    { value: "tpe-hip-mold", label: "TPE臀部倒模" },
    { value: "tpe-half-body", label: "TPE半身倒模" },
    { value: "tpe-leg-mold", label: "TPE腿部倒模" },
    { value: "tpe-local-mold", label: "TPE自慰名器" },
    { value: "silicone-hip-mold", label: "硅胶臀部倒模" },
    { value: "silicone-half-body", label: "硅胶半身倒模" },
    { value: "silicone-local-mold", label: "硅胶自慰名器" }
  ],
  "realistic-dolls": [
    { value: "tpe-realistic-dolls", label: "TPE实体娃娃" },
    { value: "silicone-realistic-dolls", label: "硅胶实体娃娃" }
  ],
  "masturbator-cups": [{ value: "masturbator-cup", label: "自慰飞机杯" }]
};

const seriesOptions = [
  { value: "hip-mold-series", label: "臀部倒模系列" },
  { value: "half-body-doll-series", label: "半身娃娃系列" },
  { value: "silicone-mold-series", label: "硅胶倒模系列" },
  { value: "realistic-doll-series", label: "实体娃娃系列" },
  { value: "masturbator-cup-series", label: "飞机杯系列" }
];

function readError(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

export function ImportNewClient() {
  const [urls, setUrls] = useState("");
  const [csv, setCsv] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [fetchPublicMetadata, setFetchPublicMetadata] = useState(true);
  const [notes, setNotes] = useState("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("intimate-molds");
  const [subcategoryId, setSubcategoryId] = useState("tpe-hip-mold");
  const [seriesId, setSeriesId] = useState("hip-mold-series");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentSubcategoryOptions = useMemo(() => subcategoryOptions[primaryCategoryId] || [], [primaryCategoryId]);

  function updatePrimaryCategory(value: string) {
    setPrimaryCategoryId(value);
    const nextSubcategories = subcategoryOptions[value] || [];
    if (!nextSubcategories.some((option) => option.value === subcategoryId)) {
      setSubcategoryId(nextSubcategories[0]?.value || "");
    }
  }

  function buildPayload() {
    return {
      urls,
      csv,
      authorized,
      notes,
      fetch_public_metadata: fetchPublicMetadata,
      primary_category_id: primaryCategoryId,
      subcategory_id: subcategoryId,
      series_id: seriesId
    };
  }

  async function callApi(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPayload())
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "请求失败。");
    return data;
  }

  function previewImport() {
    setMessage("");
    startTransition(() => {
      void (async () => {
        try {
          const data = await callApi("/api/admin/imports/preview");
          setPreview(data.preview || []);
          setMessage("已完成识别。请确认主图、分类和授权后保存为安全草稿。");
        } catch (error) {
          setMessage(readError(error));
        }
      })();
    });
  }

  function saveDrafts() {
    setMessage("");
    startTransition(() => {
      void (async () => {
        try {
          const data = await callApi("/api/admin/imports/jobs");
          const jobs = (data.createdJobs || []) as CreatedJob[];
          let applied = 0;
          let lastApplyError = "";

          for (const job of jobs) {
            const response = await fetch(`/api/admin/imports/jobs/${job.id}/apply`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({})
            });
            if (response.ok) {
              applied += 1;
            } else {
              const result = await response.json().catch(() => ({}));
              lastApplyError = result.error || "应用导入任务失败。";
            }
          }

          if (jobs.length > 0 && applied === jobs.length) {
            setMessage(`已保存 ${applied} 个商品安全草稿。默认不发布、不进前台、不显示购买按钮。`);
          } else if (jobs.length > 0) {
            setMessage(`已创建 ${jobs.length} 个导入任务，已应用 ${applied} 个。${lastApplyError || "请到任务列表继续审核。"} `);
          } else {
            setMessage(`已创建 ${data.created?.length || 0} 个导入任务，跳过 ${data.skipped?.length || 0} 个异常链接。`);
          }
        } catch (error) {
          setMessage(readError(error));
        }
      })();
    });
  }

  return (
    <main data-admin-shell className="min-h-screen bg-[#09000f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-b border-white/10 pb-5">
          <p className="text-sm font-black text-mint-300">SWEETMEILON CMS</p>
          <h1 className="mt-2 text-3xl font-black">商品链接导入助手 V2</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
            粘贴天猫、淘宝或京东商品链接，系统只读取公开页面信息并生成后台安全草稿。新草稿默认不发布、不进入前台、不显示购买按钮。
          </p>
        </header>

        {message ? <div className="rounded-xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm font-bold text-mint-200">{message}</div> : null}

        <section className="grid gap-5 rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Step 1</span>
            <span className="text-lg font-black">粘贴商品链接</span>
            <textarea
              value={urls}
              onChange={(event) => setUrls(event.target.value)}
              rows={7}
              className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm leading-6 outline-none focus:border-mint-300/70"
              placeholder="每行一个商品链接。支持 detail.tmall.com、item.taobao.com、item.jd.com，也可以直接粘贴一段包含链接的文本。"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Category</span>
              <select
                value={primaryCategoryId}
                onChange={(event) => updatePrimaryCategory(event.target.value)}
                className="h-12 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm font-bold outline-none focus:border-mint-300/70"
              >
                {primaryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Subcategory</span>
              <select
                value={subcategoryId}
                onChange={(event) => setSubcategoryId(event.target.value)}
                className="h-12 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm font-bold outline-none focus:border-mint-300/70"
              >
                {currentSubcategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Series</span>
              <select
                value={seriesId}
                onChange={(event) => setSeriesId(event.target.value)}
                className="h-12 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm font-bold outline-none focus:border-mint-300/70"
              >
                {seriesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <label className="flex items-start gap-3 text-sm font-bold leading-6 text-white/76">
              <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} className="mt-1" />
              我确认这些链接和图片资料来自自有店铺、已授权来源或手动提供资料。
            </label>
            <label className="flex items-start gap-3 text-sm font-bold leading-6 text-white/76">
              <input type="checkbox" checked={fetchPublicMetadata} onChange={(event) => setFetchPublicMetadata(event.target.checked)} className="mt-1" />
              自动读取公开标题、描述和主图，仅用于后台预览和草稿建议。
            </label>
          </div>

          <details className="rounded-xl border border-white/10 bg-[#100519] p-4">
            <summary className="cursor-pointer text-sm font-black text-white/76">高级选项：CSV / 备注</summary>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-black text-white/50">CSV 内容</span>
                <textarea
                  value={csv}
                  onChange={(event) => setCsv(event.target.value)}
                  rows={4}
                  className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm outline-none"
                  placeholder="product_name,tmall_url,jd_url,notes,authorized"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-white/50">备注</span>
                <input value={notes} onChange={(event) => setNotes(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
              </label>
            </div>
          </details>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={isPending} onClick={previewImport} className="rounded-lg border border-white/14 px-5 py-3 text-sm font-black text-white/82 hover:bg-white/8">
              识别链接
            </button>
            <button type="button" disabled={isPending || !authorized} onClick={saveDrafts} className="rounded-lg bg-mint-gradient px-5 py-3 text-sm font-black text-[#12031d] disabled:opacity-50">
              一键保存为安全草稿
            </button>
            <a href="/admin/imports" className="rounded-lg border border-white/14 px-5 py-3 text-sm font-black text-white/82 hover:bg-white/8">
              查看导入任务
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-lg font-black">识别预览</h2>
          <p className="mt-2 text-sm text-white/50">
            当前默认类目：{optionLabel(primaryOptions, primaryCategoryId)} / {optionLabel(currentSubcategoryOptions, subcategoryId)} / {optionLabel(seriesOptions, seriesId)}
          </p>
          <div className="mt-4 grid gap-4">
            {preview.map((item) => {
              const firstImage = item.metadata?.imageUrls?.[0] || item.draft?.galleryJson?.[0] || "";
              return (
                <article key={item.sourceUrl} className="grid gap-4 rounded-xl border border-white/10 bg-[#12051b] p-4 md:grid-cols-[96px_1fr]">
                  {firstImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstImage} alt={item.draft?.name || "商品预览图"} className="h-24 w-24 rounded-xl object-cover ring-1 ring-white/15" />
                  ) : (
                    <div className="grid h-24 w-24 place-items-center rounded-xl bg-white/5 text-xs text-white/36">无图</div>
                  )}
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full border border-mint-300/35 px-3 py-1 text-mint-200">{item.platform}</span>
                      <span className="rounded-full border border-white/14 px-3 py-1 text-white/58">{item.sourceProductId || "未识别 ID"}</span>
                      <span className="rounded-full border border-white/14 px-3 py-1 text-white/58">draft</span>
                      <span className="rounded-full border border-white/14 px-3 py-1 text-white/58">不进前台</span>
                      <span className="rounded-full border border-white/14 px-3 py-1 text-white/58">不显示购买按钮</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black">{item.draft?.name || item.titleDetected || "待审核商品"}</h3>
                    <p className="mt-2 break-all text-xs text-white/42">{item.draft?.slug || item.sourceUrl}</p>
                    <p className="mt-3 text-sm leading-6 text-white/58">{item.draft?.summary || "未生成草稿建议。"}</p>
                    <p className="mt-3 text-xs font-bold text-white/50">
                      {item.errors.length ? `需要处理：${item.errors.join("；")}` : item.authorized ? "可保存为安全草稿" : "请先确认授权"}
                    </p>
                  </div>
                </article>
              );
            })}
            {preview.length === 0 ? <div className="rounded-xl border border-white/10 px-4 py-8 text-center text-white/45">暂无识别结果</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
