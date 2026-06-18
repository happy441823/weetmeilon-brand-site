"use client";

import { useState, useTransition } from "react";

type PreviewItem = {
  sourceUrl: string;
  platform: string;
  sourceProductId: string | null;
  titleDetected: string;
  authorized: boolean;
  errors: string[];
};

function readError(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export function ImportNewClient() {
  const [urls, setUrls] = useState("");
  const [csv, setCsv] = useState("");
  const [productName, setProductName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function callApi(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ urls, csv, product_name: productName, authorized, notes })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "请求失败。");
    return data;
  }

  function previewImport() {
    setMessage("");
    startTransition(async () => {
      try {
        const data = await callApi("/api/admin/imports/preview");
        setPreview(data.preview || []);
        setMessage("预览已生成。请确认链接来源和授权状态后再创建任务。");
      } catch (error) {
        setMessage(readError(error));
      }
    });
  }

  function createJobs() {
    setMessage("");
    startTransition(async () => {
      try {
        const data = await callApi("/api/admin/imports/jobs");
        setMessage(`已创建 ${data.created?.length || 0} 个导入任务，跳过 ${data.skipped?.length || 0} 个异常链接。`);
      } catch (error) {
        setMessage(readError(error));
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#09000f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-b border-white/10 pb-5">
          <p className="text-sm font-black text-mint-300">SWEETMEILON CMS</p>
          <h1 className="mt-2 text-3xl font-black">商品链接导入</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
            仅处理自有店铺、已授权或手动提供的天猫/京东链接。不会保存 Cookie，不绕过登录，不使用 headless browser，不自动发布到前台。
          </p>
        </header>

        {message ? <div className="rounded-xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm font-bold text-mint-200">{message}</div> : null}

        <section className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">多行商品链接</span>
            <textarea value={urls} onChange={(event) => setUrls(event.target.value)} rows={7} className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm outline-none" placeholder="每行一个天猫或京东商品 URL" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">CSV 内容</span>
            <textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={5} className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm outline-none" placeholder="product_name,tmall_url,jd_url,category,series,status,image_urls,notes,authorized" />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-black text-white/60">商品名称</span>
              <input value={productName} onChange={(event) => setProductName(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black text-white/60">备注</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3 text-sm font-bold text-white/76">
            <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />
            我确认这些商品链接和图片资料来自自有店铺、已授权来源或手动提供资料。
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={isPending} onClick={previewImport} className="rounded-lg border border-white/14 px-4 py-2 text-sm font-black text-white/82 hover:bg-white/8">预览解析</button>
            <button type="button" disabled={isPending || !authorized} onClick={createJobs} className="rounded-lg bg-mint-gradient px-4 py-2 text-sm font-black text-[#12031d] disabled:opacity-50">创建导入任务</button>
            <a href="/admin/imports" className="rounded-lg border border-white/14 px-4 py-2 text-sm font-black text-white/82 hover:bg-white/8">查看任务列表</a>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-lg font-black">预览结果</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="border-b border-white/10 px-3 py-2">平台</th>
                  <th className="border-b border-white/10 px-3 py-2">商品 ID</th>
                  <th className="border-b border-white/10 px-3 py-2">标题</th>
                  <th className="border-b border-white/10 px-3 py-2">授权</th>
                  <th className="border-b border-white/10 px-3 py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr key={item.sourceUrl}>
                    <td className="border-b border-white/8 px-3 py-3">{item.platform}</td>
                    <td className="border-b border-white/8 px-3 py-3">{item.sourceProductId || "-"}</td>
                    <td className="border-b border-white/8 px-3 py-3">{item.titleDetected || item.sourceUrl}</td>
                    <td className="border-b border-white/8 px-3 py-3">{item.authorized ? "是" : "否"}</td>
                    <td className="border-b border-white/8 px-3 py-3">{item.errors.length ? item.errors.join("；") : "可创建"}</td>
                  </tr>
                ))}
                {preview.length === 0 ? <tr><td className="px-3 py-8 text-center text-white/45" colSpan={5}>暂无预览结果</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
