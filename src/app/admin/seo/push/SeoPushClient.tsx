"use client";

import { useState, useTransition } from "react";

export function SeoPushClient() {
  const [url, setUrl] = useState("https://sweetmeilon.com/");
  const [provider, setProvider] = useState("indexnow");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/seo/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, provider, event_type: "manual" })
      });
      const data = await response.json();
      setMessage(response.ok ? `已记录：${data.status}` : data.error || "记录失败。");
    });
  }

  return (
    <main data-admin-shell className="min-h-screen bg-[#09000f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.045] p-6">
        <p className="text-sm font-black text-mint-300">SEO 发布中心</p>
        <h1 className="mt-2 text-3xl font-black">搜索引擎推送记录</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">当前自动提交默认关闭。本页面只记录待提交 URL，供人工验收后再开启 IndexNow。</p>
        {message ? <div className="mt-5 rounded-xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm font-bold text-mint-200">{message}</div> : null}
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">站内 URL</span>
            <input value={url} onChange={(event) => setUrl(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-white/60">渠道</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none">
              <option value="indexnow">IndexNow</option>
              <option value="google_manual_list">Google 手动清单</option>
              <option value="baidu_manual_list">百度手动清单</option>
              <option value="bing_manual_list">Bing 手动清单</option>
            </select>
          </label>
          <button type="button" disabled={isPending} onClick={submit} className="h-11 rounded-lg bg-mint-gradient px-4 text-sm font-black text-[#12031d] disabled:opacity-60">记录待提交 URL</button>
          <a href="/admin/seo/indexing" className="text-sm font-bold text-mint-300">查看推送日志</a>
        </div>
      </div>
    </main>
  );
}
