import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "联系我们",
  description: "蜜女郎官方品牌站联系说明。商品、订单、物流与售后问题请优先通过天猫旗舰店或京东旗舰店客服处理。"
}, "/contact");

export default function ContactPage() {
  return (
    <main>
      <TrackView event="view_contact" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Contact"
          title="商品和订单问题，请优先联系官方旗舰店客服"
          description="官网用于展示品牌与产品信息，不直接处理平台订单。涉及商品详情、优惠、物流、售后、发票等问题，请以天猫或京东官方旗舰店客服回复为准。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["商品咨询", "通过天猫旗舰店或京东旗舰店查看具体商品页并咨询店铺客服。"],
            ["订单与物流", "在对应平台订单页查看物流、售后和退款进度。"],
            ["官网合作", "可在后续填入品牌邮箱、商务微信或表单入口。"]
          ].map(([title, text]) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
              <h2 className="text-xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-aura/66">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <StoreButtons source="contact_page" />
        </div>
      </section>
    </main>
  );
}
