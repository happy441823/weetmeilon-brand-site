import type { Metadata } from "next";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "暂不访问",
  description: "本页面用于年龄确认未通过时的安全离开提示。",
  robots: {
    index: false,
    follow: false
  }
}, "/not-for-minors");

export default function NotForMinorsPage() {
  return (
    <main className="container-shell grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/[0.045] p-8">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-mint-300">Access Limited</p>
        <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">已离开本站内容区</h1>
        <p className="mt-5 text-sm leading-7 text-aura/70">
          本站仅面向年满 18 周岁的成年人。若你未满 18 周岁，或不希望继续访问，请关闭当前页面。
        </p>
      </div>
    </main>
  );
}
