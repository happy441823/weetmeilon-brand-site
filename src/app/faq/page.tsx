import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { getPublicFaqs, type PublicFaq } from "@/lib/cms/public-faqs";
import { withCanonical } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = withCanonical({
  title: "FAQ 常见问题",
  description: "蜜女郎常见问题：材质是否真实、触感是否高级、隐私发货、清洁保养、多款产品怎么选、为什么跳转官方渠道购买。"
}, "/faq");

const fallbackFaqs: PublicFaq[] = [
  ["这是官方品牌站吗？", "是。这里用于介绍蜜女郎品牌、材质体验、产品系列、隐私发货和清洁保养。具体商品购买请前往蜜女郎天猫或京东旗舰店。"],
  ["为什么官网不直接下单？", "官网主要提供品牌和产品信息参考。具体商品、价格、库存、优惠、物流和售后，由天猫或京东官方旗舰店负责。"],
  ["天猫和京东哪个是官方渠道？", "官网会展示已确认的官方渠道入口。进入对应平台后，请认准蜜女郎官方旗舰店页面，并以平台内实时商品信息为准。"],
  ["隐私发货怎么看？", "下单前建议查看官方旗舰店的发货说明、包装说明和客服回复。不同平台、仓库和活动期规则可能不同，以旗舰店页面为准。"],
  ["包装面单会显示什么？", "包装和面单展示由实际发货平台与店铺规则决定。官网只提供隐私购买提醒，不承诺具体面单字段，请下单前向官方客服确认。"],
  ["新品预告为什么没有购买按钮？", "新品预告只用于提前说明材质体验方向和产品状态，未开放官网购买入口，因此不会展示天猫或京东购买按钮。"],
  ["材质说明以哪里为准？", "官网介绍品牌材质概念和体验方向，具体商品的材质、规格、尺寸与使用说明，以官方旗舰店商品页面为准。"],
  ["原生肌凝硅是什么？", "原生肌凝硅是蜜女郎用于表达柔软、回弹、细腻表面与清洁体验的品牌材质概念，不代表医疗用途或第三方认证。"],
  ["TPE 和硅胶怎么理解？", "可以先把它们理解为不同材质方向。具体软硬、重量、清洁方式和保养要求会随商品结构不同而变化，请以商品详情页说明为准。"],
  ["如何清洁？", "使用前后建议按具体商品说明进行清洁，动作保持温和，避免使用不确定是否适合材质的强刺激清洁剂或尖锐工具。"],
  ["如何晾干？", "清洁后应充分晾干再收纳，避免潮湿状态下长时间密闭存放。具体晾干方式以商品说明和官方客服建议为准。"],
  ["如何收纳？", "建议单独收纳，避免与易掉色、易粘附或尖锐物品长期接触，并放在阴凉、干燥、避光的位置。"],
  ["为什么官网不展示实时价格？", "价格、库存、优惠和物流信息会随平台活动变化，官网不展示不稳定数据，购买前请以官方旗舰店实时页面为准。"],
  ["售后在哪里处理？", "售后、退款、换货、物流异常和发票等问题，应在对应平台的蜜女郎官方旗舰店内处理，便于保留订单记录。"],
  ["官网会收集我的订单信息吗？", "官网不直接处理天猫或京东订单。若网站接入访问统计，仅用于分析页面访问与按钮点击，不用于识别具体个人订单。"],
  ["未成年人可以访问或购买吗？", "不可以。本站仅面向年满 18 周岁成年人，未成年人请立即离开。"]
];

function faqJsonLd(faqs: PublicFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };
}

export default async function FaqPage() {
  const faqs = await getPublicFaqs(fallbackFaqs);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)).replace(/</g, "\\u003c") }}
      />
      <TrackView event="view_faq" />
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="FAQ"
          title="把购买前最关心的问题，先回答清楚"
          description="FAQ 不追求制造刺激，而是回答真实问题：品牌身份、材质体验、隐私发货、清洁方式、产品选择与官方购买渠道。"
        />
        <div className="mt-8 grid gap-4">
          {faqs.map(([question, answer]) => (
            <article key={question} className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6">
              <h2 className="text-xl font-black text-white">{question}</h2>
              <p className="mt-3 text-sm leading-7 text-aura/68">{answer}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <StoreButtons source="faq_page" />
        </div>
      </section>
    </main>
  );
}
