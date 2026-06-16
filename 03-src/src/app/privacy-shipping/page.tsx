import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "隐私购买与收货提示",
  description: "蜜女郎隐私购买与收货提示：关注包装、面单、收货通知与官方旗舰店规则，实际发货以天猫旗舰店或京东旗舰店页面展示为准。"
}, "/privacy-shipping");

export default function PrivacyShippingPage() {
  return (
    <main>
      <TrackView event="view_privacy_shipping" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Privacy Shipping"
          title="隐私购买与收货提示"
          description="隐私包装，是许多用户购买前最关心的问题之一。官网帮助你提前了解包装、面单、配送与售后沟通中的注意事项；具体规则以天猫或京东旗舰店页面为准。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["包装与面单", "下单前查看旗舰店商品页面和店铺说明，确认外包装、面单展示与发货规则。"],
            ["收货安排", "建议选择稳定、方便本人收取的地址，并留意平台物流通知，减少不必要的信息暴露。"],
            ["售后沟通", "如需咨询，优先通过旗舰店官方客服沟通，并注意保护订单、地址与联系方式等个人信息。"]
          ].map(([title, text]) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
              <h2 className="text-xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-aura/66">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="rounded-[34px] border border-mint-300/22 bg-hero-radial p-6 md:p-10">
          <h2 className="text-3xl font-black text-white">查看具体包装与发货规则，请前往官方旗舰店</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-aura/68">官网不直接处理订单。包装、面单、配送、退款及售后规则，以天猫或京东官方旗舰店页面为准。</p>
          <div className="mt-7">
            <StoreButtons source="privacy_shipping_page" />
          </div>
        </div>
      </section>
    </main>
  );
}
