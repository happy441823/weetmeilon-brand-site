import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "隐私政策",
  description: "蜜女郎官方品牌站隐私政策：说明订单信息、访问统计、官方渠道跳转和未成年人限制。"
}, "/privacy-policy");

export default function PrivacyPolicyPage() {
  return (
    <main className="container-shell py-14 md:py-20">
      <SectionHeader eyebrow="Privacy Policy" title="隐私政策" description="这里说明官网访问、官方渠道跳转和基础统计相关的信息处理方式。" />
      <div className="mt-8 space-y-5 text-sm leading-8 text-aura/68">
        <p>本网站仅面向年满 18 周岁成年人，用于展示蜜女郎品牌信息、材质说明、产品选择参考、清洁指南和官方购买渠道跳转入口。</p>
        <p>本站不直接处理天猫或京东订单。用户点击购买按钮后，将跳转至天猫旗舰店或京东旗舰店，订单、支付、物流、售后和账号信息由对应平台依据其规则处理。</p>
        <p>若环境变量配置了 Google Analytics 4 或百度统计，本站可能记录页面访问、按钮点击、文章阅读等匿名或聚合数据，仅用于了解页面使用情况，不用于识别具体个人订单。</p>
        <p>本站会在浏览器本地存储 18+ 年龄确认记录，有效期约 30 天；访问统计服务也可能依据其规则使用 Cookie 或类似技术。你可以通过浏览器设置清除本地存储或限制 Cookie。</p>
        <p>请勿在官网公开提交身份证件、订单截图、联系方式等敏感信息。涉及商品、订单、物流和售后，请优先通过天猫或京东官方旗舰店客服沟通。</p>
        <p>未成年人不得访问或使用本站。如你未满 18 周岁，请立即关闭页面。</p>
      </div>
    </main>
  );
}
