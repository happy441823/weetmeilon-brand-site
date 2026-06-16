import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "用户协议",
  description: "蜜女郎官方品牌站用户协议。"
}, "/terms");

export default function TermsPage() {
  return (
    <main className="container-shell py-14 md:py-20">
      <SectionHeader eyebrow="Terms" title="用户协议" description="访问本站前，请了解本站内容用途、年龄限制和官方旗舰店购买规则。" />
      <div className="mt-8 space-y-5 text-sm leading-8 text-aura/68">
        <p>访问本站即表示你确认已年满 18 周岁，并同意仅将本站内容用于了解品牌信息、材质说明、产品选择参考和官方购买路径。</p>
        <p>本站不直接销售商品，不处理订单、支付、物流或售后。所有购买行为均在天猫旗舰店或京东旗舰店所在平台完成，具体规则以对应页面展示为准。</p>
        <p>本站内容不得被用于面向未成年人传播，不得被截取、改写为低俗、露骨、误导或夸大效果的商业宣传。</p>
        <p>本站可能根据产品上新、活动和合规要求更新页面内容。请以最新页面展示为准。</p>
      </div>
    </main>
  );
}
