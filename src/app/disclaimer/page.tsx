import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "免责声明",
  description: "蜜女郎官方品牌站免责声明：不构成医疗建议，不承诺医疗、健康、情感或能力效果。"
}, "/disclaimer");

export default function DisclaimerPage() {
  return (
    <main className="container-shell py-14 md:py-20">
      <SectionHeader eyebrow="Disclaimer" title="免责声明" description="这里说明官网内容边界、材质表达边界和官方旗舰店购买信息的适用范围。" />
      <div className="mt-8 space-y-5 text-sm leading-8 text-aura/68">
        <p>本站内容用于品牌展示、材质说明、产品选择参考、清洁保养建议和官方渠道跳转，不构成医疗建议。</p>
        <p>本站不承诺任何医疗、健康、情感或能力效果，不虚构安全认证、检测报告、专利、销售数据或用户评价。</p>
        <p>原生肌凝硅为品牌材质科技表达，重点描述柔软、回弹、细腻表面和日常清洁体验目标，不代表医疗材料或法定认证。</p>
        <p>商品规格、价格、库存、优惠、物流、发货和售后信息，以天猫或京东官方旗舰店页面为准。</p>
      </div>
    </main>
  );
}
