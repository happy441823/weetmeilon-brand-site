"use client";

import { useState, useTransition } from "react";

export function SeoArticleGenerateClient() {
  const [keyword, setKeyword] = useState("");
  const [articleType, setArticleType] = useState("产品选择指南");
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/seo/articles/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword, article_type: articleType, product_id: productId, include_faq: true, include_cta: true })
      });
      const data = await response.json();
      setMessage(response.ok ? `已保存草稿生成任务：${data.id}` : data.error || "生成失败。");
    });
  }

  return (
    <main className="min-h-screen bg-[#09000f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.045] p-6">
        <p className="text-sm font-black text-mint-300">AI 文章生成</p>
        <h1 className="mt-2 text-3xl font-black">生成文章草稿</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">当前 CMS_AI_GENERATION_ENABLE=false。本页面只创建 draft 生成任务，不调用外部 AI，不发布到正式前台。</p>
        {message ? <div className="mt-5 rounded-xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm font-bold text-mint-200">{message}</div> : null}
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">目标关键词</span>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">文章类型</span>
            <select value={articleType} onChange={(event) => setArticleType(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none">
              {["产品选择指南", "材质科普", "清洁保养", "隐私购买", "品牌介绍", "新品介绍", "FAQ 扩展"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">关联商品 ID</span>
            <input value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
          </label>
          <button type="button" disabled={isPending} onClick={submit} className="h-11 rounded-lg bg-mint-gradient px-4 text-sm font-black text-[#12031d] disabled:opacity-60">保存为 draft 任务</button>
          <a href="/admin/seo/indexing" className="text-sm font-bold text-mint-300">查看 SEO/AI 草稿与推送记录</a>
        </div>
      </div>
    </main>
  );
}
