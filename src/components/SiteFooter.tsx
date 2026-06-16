import Image from "next/image";
import Link from "next/link";
import { StoreButtons } from "@/components/StoreButtons";
import { BRAND } from "@/lib/constants";

const footerLinks = [
  { label: "隐私政策", href: "/privacy-policy" },
  { label: "用户协议", href: "/terms" },
  { label: "免责声明", href: "/disclaimer" },
  { label: "联系我们", href: "/contact" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink/84">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-3">
            <span className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white">
              <Image src="/images/logo.png" alt="蜜女郎 Logo" fill sizes="40px" className="object-contain p-1.5" />
            </span>
            <div>
              <p className="text-base font-black text-white">{BRAND.shortName}</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-mint-300/80">SWEETMEILON</p>
              <p className="mt-1 text-sm text-aura/68">官方品牌站 · 最终购买请以官方渠道页面展示为准</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-aura/72">
            本站仅面向年满 18 周岁成年人。页面内容用于品牌介绍、材质说明、产品选择参考和清洁保养建议，不构成医疗、健康、情感或能力承诺。
          </p>
        </div>
        <div className="grid gap-4 md:justify-items-end">
          <StoreButtons source="footer" />
          <div className="flex flex-wrap gap-3 text-[13px] text-aura/68">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-mint-300">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
