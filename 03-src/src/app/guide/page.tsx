import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "使用与清洁指南",
  description: "蜜女郎硅胶产品使用与清洁保养指南：使用前后清洁、充分晾干、独立收纳，具体商品说明以天猫旗舰店或京东旗舰店页面展示为准。"
}, "/guide");

const steps = [
  ["使用前", "先阅读商品详情、包装说明与使用提示，确认产品状态完整，并按说明进行基础清洁。"],
  ["使用后", "按商品说明及时清洁，避免长时间残留；清洁时采用温和方式，不使用粗糙刷具。"],
  ["彻底晾干", "清洁后放在通风处充分晾干，避免在潮湿状态下直接密封收纳。"],
  ["单独收纳", "避光、干燥并单独存放，避免与深色、易染色或可能粘连的材质长期接触。"]
];

export default function GuidePage() {
  return (
    <main>
      <TrackView event="view_guide" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Care Guide"
          title="清洁保养不是附加项，而是体验的一部分"
          description="正确的清洁、晾干与收纳，有助于保持稳定的使用体验。不同产品的材质和结构可能存在差异，请优先参考商品页面与包装说明。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([title, text], index) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5">
              <p className="text-sm font-black text-mint-300">0{index + 1}</p>
              <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-aura/64">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-white">建议做</h2>
            <ul className="mt-5 grid gap-3">
              {["使用前后清洁", "充分晾干后收纳", "单独收纳并保持干燥", "定期检查表面状态", "遇到疑问查看官方旗舰店商品说明或咨询店铺客服"].map((item) => (
                <li key={item} className="rounded-2xl border border-mint-300/18 bg-mint-300/8 px-4 py-3 text-sm font-semibold text-aura/78">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">请避免</h2>
            <ul className="mt-5 grid gap-3">
              {["不使用粗糙刷具大力摩擦", "不在潮湿状态长期密封", "不与深色或易染色材料长期贴合", "不将官网内容理解为医疗建议", "不忽略官方旗舰店详情页的具体说明"].map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-aura/64">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container-shell mt-8">
          <StoreButtons source="guide_page" />
        </div>
      </section>
    </main>
  );
}
