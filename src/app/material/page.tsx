import type { Metadata } from "next";
import { MaterialVisual } from "@/components/MaterialVisual";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "原生肌凝硅材质体验",
  description: "蜜女郎原生肌凝硅材质体验页：围绕柔软、回弹表现、细腻表面与清洁保养做克制说明，不虚构认证或医疗承诺。",
  keywords: ["原生肌凝硅", "硅胶产品", "柔软触感", "材质体验"]
}, "/material");

const dimensions = [
  {
    title: "柔软",
    text: "柔软是接触时的第一感受，实际体验会受到产品结构、厚度与个人感受影响。"
  },
  {
    title: "回弹表现",
    text: "回弹用于描述受力后恢复形态的表现，具体体验以实际商品及使用说明为准。"
  },
  {
    title: "细腻",
    text: "通过表面纹理、局部细节与光泽表现，呈现更细致的视觉和触感层次。"
  },
  {
    title: "清洁与保养",
    text: "结合适合的表面处理与正确清洁方式，帮助形成更稳定的日常保养习惯。"
  }
];

export default function MaterialPage() {
  return (
    <main>
      <TrackView event="view_material_page" />
      <section className="container-shell grid gap-8 py-14 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Native Skin Silicone"
            title="原生肌凝硅，蜜女郎对柔软质感的表达"
            description={"原生肌凝硅是蜜女郎用于表达材质体验方向的品牌概念，重点围绕柔软、回弹、细腻表面与日常清洁展开。\n本页用于帮助理解材质体验，具体材质、规格和使用说明以官方旗舰店商品页面为准。"}
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/products?status=upcoming" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:-translate-y-0.5">
              查看新品预告
            </Link>
            <Link href="/guide" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-black text-white transition hover:bg-white/8">
              查看使用指南
            </Link>
          </div>
        </div>
        <MaterialVisual />
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <div className="container-shell">
          <SectionHeader eyebrow="Four Dimensions" title="从四个维度，理解材质体验" description="从柔软、回弹、细腻到易清洁，逐项了解不同体验方向。" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {dimensions.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
                <h2 className="text-2xl font-black text-mint-300">{item.title}</h2>
                <p className="mt-4 text-sm leading-7 text-aura/66">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
