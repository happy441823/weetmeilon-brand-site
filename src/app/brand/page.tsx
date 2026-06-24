import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { BRAND } from "@/lib/constants";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "品牌理念",
  description: "了解蜜女郎官方品牌站：以清楚、克制、有边界感的方式介绍材质体验、产品系列、隐私购买提示和清洁保养。"
}, "/brand");

const principles = [
  {
    title: "真实",
    text: "只呈现能够被商品信息和实际购买页面支持的内容，不用夸张表达替代真实说明。"
  },
  {
    title: "克制",
    text: "用清楚、尊重、有边界感的方式介绍产品，减少低俗、露骨和过度暗示。"
  },
  {
    title: "安心选择",
    text: "把材质、触感、清洁方式、隐私说明和官方渠道整理清楚，让选择更有依据。"
  }
];

const learnItems = [
  {
    title: "认识材质",
    text: "了解蜜女郎对柔软、回弹、细腻表面与日常清洁体验的表达。"
  },
  {
    title: "比较系列",
    text: "从关注重点和使用习惯出发，了解不同系列之间的区别。"
  },
  {
    title: "确认购买信息",
    text: "查看隐私购买提示、清洁保养和官方购买渠道说明，再决定是否前往旗舰店。"
  }
];

export default function BrandPage() {
  return (
    <main>
      <TrackView event="view_brand" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Brand Philosophy"
          title={`${BRAND.name}，把选择讲清楚，也把边界守清楚`}
          description={"我们希望成人用品也能被认真、克制地介绍。\n蜜女郎官网聚焦材质体验、产品差异、隐私购买提示与清洁保养，让每一次了解和选择都更清楚。"}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {principles.map((item) => (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
              <h2 className="text-2xl font-black text-mint-300">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-aura/72">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[34px] border border-white/10 bg-hero-radial p-6 shadow-purple md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">What You Can Learn</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">你可以在这里了解</h2>
          </div>
          <div className="grid gap-4">
            {learnItems.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5">
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-aura/72">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14 md:py-20">
        <div className="rounded-[34px] border border-mint-300/22 bg-white/[0.055] p-6 md:p-10">
          <h2 className="text-3xl font-black text-white">了解清楚，再去官方旗舰店购买</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-aura/72">
            官网提供品牌与产品信息参考，具体商品规格、发货、物流及售后服务，由天猫或京东官方旗舰店提供。
          </p>
          <div className="mt-7">
            <StoreButtons source="brand_page" />
          </div>
        </div>
      </section>
    </main>
  );
}
