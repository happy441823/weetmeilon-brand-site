import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "前往官方渠道购买",
  description: "蜜女郎官网购买路径说明：官网了解品牌与产品，天猫旗舰店或京东旗舰店完成下单、优惠、物流与售后。"
}, "/buy");

export default function BuyPage() {
  return (
    <main>
      <TrackView event="view_buy_page" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Official Channels"
          title="官网了解清楚，官方旗舰店渠道完成购买"
          description="蜜女郎官网不直接销售商品。购买按钮提供天猫旗舰店与京东旗舰店两个官方渠道，方便你查看真实商品、优惠、库存、物流与售后规则。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["1", "阅读官网", "了解品牌、材质科技、产品系列和隐私发货说明。"],
            ["2", "选择产品", "按触感、清洁、隐私和官方渠道顾虑选择适合系列。"],
            ["3", "选择渠道", "进入天猫旗舰店或京东旗舰店；已确认商品页会单独展示对应平台的同款入口。"],
            ["4", "完成购买", "在天猫或京东官方旗舰店页面确认规格、价格、活动、物流与售后后下单。"]
          ].map(([step, title, text]) => (
            <article key={step} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5">
              <p className="text-sm font-black text-mint-300">STEP {step}</p>
              <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-aura/64">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <StoreButtons source="buy_page" />
        </div>
      </section>
    </main>
  );
}
