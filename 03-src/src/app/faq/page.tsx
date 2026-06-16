import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "FAQ 常见问题",
  description: "蜜女郎常见问题：材质是否真实、触感是否高级、隐私发货、清洁保养、多款产品怎么选、为什么跳转官方渠道购买。"
}, "/faq");

const faqs = [
  ["这是蜜女郎官网吗？", "是。这里用于介绍蜜女郎品牌、材质体验、产品系列、隐私发货和清洁保养。具体商品购买请前往蜜女郎天猫或京东旗舰店。"],
  ["官网如何说明材质信息？", "官网介绍品牌材质概念和体验方向，具体商品的材质、规格、尺寸与使用说明，以官方旗舰店商品页面为准。"],
  ["原生肌凝硅是什么？", "原生肌凝硅是蜜女郎用于表达柔软、回弹、细腻表面与清洁体验的品牌材质概念，不代表医疗用途或第三方认证。"],
  ["不同系列的触感有什么区别？", "官网会从柔软、回弹、表面纹理和细腻度等方向进行比较，实际体验还会受到具体产品结构和个人感受影响。"],
  ["是否隐私发货？", "官网提供隐私发货说明入口，具体外包装、面单、物流与发货规则，以天猫或京东旗舰店页面为准。"],
  ["产品如何清洁和收纳？", "使用前后应按商品说明进行清洁，充分晾干后单独收纳。不同材质和结构可能有不同要求，请以具体商品说明为准。"],
  ["三款系列应该怎么选？", "优先从材质触感、表面细节、隐私需求与清洁习惯出发，再进入官方旗舰店确认具体规格和商品信息。"],
  ["为什么官网不直接下单？", "官网主要提供品牌和产品信息参考。具体商品、价格、库存、优惠、物流和售后，由天猫或京东官方旗舰店负责。"],
  ["官网会收集我的订单信息吗？", "官网不直接处理天猫或京东订单。若网站接入访问统计，仅用于分析页面访问与按钮点击，不用于识别具体个人订单。"],
  ["未成年人可以访问或购买吗？", "不可以。本站仅面向年满 18 周岁成年人，未成年人请立即离开。"]
];

export default function FaqPage() {
  return (
    <main>
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
