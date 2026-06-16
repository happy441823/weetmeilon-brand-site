"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CatalogCategory } from "@/types/catalog";
import type { AdminProductSubmission } from "@/types/admin-product";

type ProductAdminClientProps = {
  primaryCategories: CatalogCategory[];
  subcategories: CatalogCategory[];
};

type ApiListResponse = {
  products: AdminProductSubmission[];
};

const categoryLabels: Record<string, string> = {
  "tpe-mold": "TPE 倒模",
  "silicone-mold": "硅胶倒模",
  "realistic-dolls": "实体娃娃",
  "masturbator-cups": "飞机杯系列",
  "tpe-hip-mold": "TPE 臀模系列",
  "tpe-half-body": "TPE 半身系列",
  "tpe-local-mold": "TPE 名器系列",
  "tpe-leg-mold": "TPE 腿模系列",
  "tpe-chest-mold": "TPE 胸模系列",
  "silicone-hip-mold": "硅胶臀模系列",
  "silicone-half-body": "硅胶半身系列",
  "silicone-local-mold": "硅胶名器系列",
  "silicone-leg-mold": "硅胶腿模系列",
  "silicone-chest-mold": "硅胶胸模系列",
  "tpe-realistic-dolls": "TPE 实体娃娃",
  "silicone-realistic-dolls": "硅胶实体娃娃"
};

function categoryLabel(item: Pick<CatalogCategory, "id" | "name">) {
  return categoryLabels[item.id] || item.name || item.id;
}

export function ProductAdminClient({ primaryCategories, subcategories }: ProductAdminClientProps) {
  const [products, setProducts] = useState<AdminProductSubmission[]>([]);
  const [categoryId, setCategoryId] = useState(primaryCategories[0]?.id || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploadPassword, setUploadPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const availableSubcategories = useMemo(
    () => subcategories.filter((item) => item.parentId === categoryId),
    [categoryId, subcategories]
  );

  async function loadProducts(password = uploadPassword) {
    const response = await fetch("/api/admin/products", {
      cache: "no-store",
      headers: password ? { "x-admin-upload-password": password } : {}
    });
    const data = (await response.json()) as ApiListResponse;
    if (!response.ok) {
      setProducts([]);
      setIsUnlocked(false);
      setMessage("请输入正确的上传密码。");
      return;
    }

    setProducts(data.products);
    setIsUnlocked(true);
  }

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem("adminUploadPassword") || "";
    if (savedPassword) {
      setUploadPassword(savedPassword);
      void loadProducts(savedPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("categoryId", categoryId);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: uploadPassword ? { "x-admin-upload-password": uploadPassword } : {},
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "保存失败，请检查填写内容。");
        return;
      }

      form.reset();
      setPreviewUrl(null);
      setMessage("已保存，下面的待检查列表已更新。");
      await loadProducts();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 md:p-6 lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">上传访问密码</span>
            <input
              value={uploadPassword}
              onChange={(event) => {
                setUploadPassword(event.target.value);
                setIsUnlocked(false);
              }}
              type="password"
              className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
              placeholder="发给同事的上传密码"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.setItem("adminUploadPassword", uploadPassword);
              void loadProducts(uploadPassword);
            }}
            className="focus-ring h-12 rounded-full border border-mint-300/35 px-6 text-sm font-black text-mint-300 hover:bg-mint-300/10"
          >
            解锁上传
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/52">
          公网临时入口请只发给需要上传商品的人；输入密码后才能查看待检查商品并提交。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(24,0,45,0.28)] md:p-6">
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">后台商品识别名称</span>
            <span className="text-xs leading-5 text-white/52">只用于后台识别和检查，不等同于官网卡片标题；官网卡片显示下面的文案介绍。</span>
            <input
              name="name"
              required
              className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
              placeholder="例如：硅胶臀模新款-天猫款"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-[#100019]/45 p-4">
            <p className="mb-4 text-sm font-black text-mint-300">卡片文案介绍</p>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-black text-white">系列/标签文案</span>
                <input
                  name="seriesLabel"
                  required
                  className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
                  placeholder="例如：原生肌凝硅系列"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-white">主标题文案</span>
                <input
                  name="cardTitle"
                  required
                  className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
                  placeholder="例如：原生肌凝硅・柔感系列"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-white">简介文案</span>
                <textarea
                  name="cardDescription"
                  required
                  rows={4}
                  className="focus-ring resize-none rounded-xl border border-white/12 bg-[#160722]/80 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/32"
                  placeholder="例如：围绕柔软、回弹与细腻表面体验展开，适合优先关注材质触感的用户。"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-white">一级类目</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none"
              >
                {primaryCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-white">二级类目</span>
              <select
                name="subcategoryId"
                className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none"
              >
                <option value="">暂不选择</option>
                {availableSubcategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-white">天猫商品链接</span>
              <input
                name="tmallUrl"
                className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
                placeholder="粘贴天猫商品详情页链接"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-white">京东商品链接</span>
              <input
                name="jdUrl"
                className="focus-ring h-12 rounded-xl border border-white/12 bg-[#160722]/80 px-4 text-sm text-white outline-none placeholder:text-white/32"
                placeholder="粘贴京东商品详情页链接"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">产品主图</span>
            <span className="text-xs leading-5 text-white/52">
              推荐尺寸：1200 × 900 px，比例 4:3；建议使用白底图、透明底图或已精修官网主图。
              <a className="ml-2 font-black text-mint-300 underline-offset-4 hover:underline" href="/templates/product-main-image-template-1200x900.png" download>
                下载主图模板
              </a>
            </span>
            <input
              name="image"
              type="file"
              accept="image/*"
              required
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setPreviewUrl(null);
                  return;
                }
                setPreviewUrl((current) => {
                  if (current) {
                    URL.revokeObjectURL(current);
                  }
                  return URL.createObjectURL(file);
                });
              }}
              className="block w-full rounded-xl border border-dashed border-mint-300/35 bg-[#160722]/70 px-4 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-mint-gradient file:px-4 file:py-2 file:text-sm file:font-black file:text-[#15051f]"
            />
          </label>

          {previewUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#100019]">
              <Image src={previewUrl} alt="上传预览" fill unoptimized className="object-contain" />
            </div>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">备注</span>
            <textarea
              name="notes"
              rows={4}
              className="focus-ring resize-none rounded-xl border border-white/12 bg-[#160722]/80 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/32"
              placeholder="可填写颜色、规格、价格、素材来源等需要我检查的信息"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || !isUnlocked}
            className="focus-ring h-12 rounded-full bg-mint-gradient px-5 text-sm font-black text-[#15051f] shadow-[0_16px_38px_rgba(100,242,220,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "保存中..." : isUnlocked ? "保存到待检查列表" : "先输入上传密码"}
          </button>

          {message ? <p className="text-sm font-bold text-mint-300">{message}</p> : null}
        </div>
      </form>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 md:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-mint-300">Pending Review</p>
            <h2 className="mt-2 text-2xl font-black text-white">待检查商品</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadProducts()}
            disabled={!isUnlocked}
            className="focus-ring rounded-full border border-white/14 px-4 py-2 text-sm font-bold text-white/78 hover:bg-white/8"
          >
            刷新
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {products.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-[#160722]/50 p-4 text-sm leading-7 text-white/62">
              还没有保存商品。你上传后会出现在这里，我再按图片清晰度、类目、链接可用性逐条检查。
            </p>
          ) : (
            products.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-xl border border-white/10 bg-[#160722]/58 p-4 sm:grid-cols-[132px_1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#100019]">
                  <Image src={item.coverImage} alt={item.name} fill sizes="132px" className="object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-mint-300/30 px-3 py-1 text-xs font-black text-mint-300">
                      {item.reviewStatus === "pending_review" ? "待检查" : item.reviewStatus === "approved" ? "已上官网" : item.reviewStatus}
                    </span>
                    {item.tmallUrl ? (
                      <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/62">天猫</span>
                    ) : null}
                    {item.jdUrl ? (
                      <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/62">京东</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-white">{item.name}</h3>
                  <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-xs font-black text-mint-300">{item.seriesLabel}</p>
                    <p className="mt-1 text-base font-black text-white">{item.cardTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-white/62">{item.cardDescription}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/62">
                    类目：{item.categoryId}
                    {item.subcategoryId ? ` / ${item.subcategoryId}` : ""}
                  </p>
                  <div className="mt-2 grid gap-1">
                    {item.tmallUrl ? (
                      <a className="block truncate text-sm font-bold text-mint-300" href={item.tmallUrl} target="_blank" rel="noreferrer">
                        天猫：{item.tmallUrl}
                      </a>
                    ) : null}
                    {item.jdUrl ? (
                      <a className="block truncate text-sm font-bold text-mint-300" href={item.jdUrl} target="_blank" rel="noreferrer">
                        京东：{item.jdUrl}
                      </a>
                    ) : null}
                  </div>
                  {item.notes ? <p className="mt-3 text-sm leading-6 text-white/62">{item.notes}</p> : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
