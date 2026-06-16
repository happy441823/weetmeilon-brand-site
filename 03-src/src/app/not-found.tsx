import Link from "next/link";
import { StoreButtons } from "@/components/StoreButtons";

export default function NotFound() {
  return (
    <main className="container-shell grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-mint-300">404</p>
        <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">这个页面暂时不存在</h1>
        <p className="mt-5 text-sm leading-7 text-aura/66">你可以返回首页继续了解品牌、材质和产品系列，或直接选择蜜女郎官方旗舰店渠道。</p>
        <div className="mt-8 grid justify-center gap-3 sm:grid-cols-[auto_auto_auto]">
          <Link href="/" className="focus-ring inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-black text-white transition hover:bg-white/8">
            返回首页
          </Link>
          <StoreButtons source="404_page" className="sm:col-span-2" />
        </div>
      </div>
    </main>
  );
}
