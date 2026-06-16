import Link from "next/link";
import { HeroVisual } from "@/components/HeroVisual";
import { MaterialVisual } from "@/components/MaterialVisual";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { TrustStrip } from "@/components/TrustStrip";
import { BRAND, complianceNote, trustPoints } from "@/lib/constants";
import { publishedArticles } from "@/lib/articles";
import { getFeaturedActiveProducts, getFeaturedUpcomingProducts, getPrimaryCategoriesWithProducts } from "@/lib/catalog";

const concernCards = [
  {
    question: "材质是否真实？",
    answer: "官网介绍品牌材质概念和体验方向，具体商品材质、规格与使用说明，以官方旗舰店商品页面为准。"
  },
  {
    question: "不同系列怎么选？",
    answer: "可以先从柔软、回弹、表面纹理、隐私需求与清洁习惯出发，再查看具体商品规格。"
  },
  {
    question: "是否隐私发货？",
    answer: "官网提供隐私发货说明入口，具体外包装、面单、物流与发货规则，以天猫或京东旗舰店页面为准。"
  },
  {
    question: "如何清洁和收纳？",
    answer: "使用前后应按商品说明清洁，充分晾干后单独收纳；不同材质和结构请以具体商品说明为准。"
  }
];

export default function HomePage() {
  const upcomingProducts = getFeaturedUpcomingProducts();
  const activeProducts = getFeaturedActiveProducts().slice(0, 4);
  const visibleCategories = getPrimaryCategoriesWithProducts();

  return (
    <main>
      <TrackView event="view_home" />
      <section className="relative overflow-hidden">
        <div className="container-shell grid gap-8 pb-12 pt-10 md:pb-20 md:pt-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {trustPoints.map((item) => (
                <span key={item} className="rounded-full border border-mint-300/25 bg-mint-300/8 px-3 py-1 text-xs font-bold text-mint-300">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-mint-300">{BRAND.name} · 官方品牌站</p>
            <h1 className="mt-4 text-balance text-5xl font-black tracking-tight text-white md:text-7xl">
              真实质感，
              <span className="block bg-mint-gradient bg-clip-text text-transparent">从材质开始</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-aura/72">
              从材质触感到产品选择，从隐私发货到清洁保养，蜜女郎官网帮你在购买前了解得更清楚、更安心。具体商品、优惠、库存及售后信息，以天猫或京东官方旗舰店页面为准。
            </p>
            <div className="mt-8 grid gap-3">
              <StoreButtons source="home_hero" buttonClassName="w-full md:w-auto md:min-w-44" />
              <a
                href="#official-buy"
                className="hidden"
              >
                官方渠道购买
                <span aria-hidden>↓</span>
              </a>
              <Link
                href="/material"
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-black text-white transition hover:bg-white/8 md:w-fit"
              >
                了解原生肌凝硅
                <span aria-hidden>›</span>
              </Link>
            </div>
            <p className="mt-5 text-xs leading-6 text-aura/50">{complianceNote}</p>
          </div>
          <HeroVisual />
        </div>
      </section>

      <TrustStrip />

      <section className="container-shell py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeader
            eyebrow="Material Technology"
              title="原生肌凝硅，蜜女郎对柔软质感的表达"
              description="从柔软、回弹、细腻表面到日常清洁，逐步了解蜜女郎的品牌材质概念与体验方向。"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {["柔软触感", "稳定回弹", "细腻表面"].map((item, index) => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/[0.055] p-5">
                <p className="text-4xl font-black text-mint-300">0{index + 1}</p>
                <h3 className="mt-4 text-lg font-black text-white">{item}</h3>
                <p className="mt-2 text-sm leading-7 text-aura/62">用于帮助理解材质体验方向，具体信息以官方旗舰店商品页面为准。</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <MaterialVisual />
        </div>
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <TrackView event="view_new_arrivals_section" />
        <div className="container-shell">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="New Arrivals Preview"
              title="原生肌凝硅系列，即将上新"
              description="围绕柔软、回弹与细腻表面体验展开的三款新品，正式商品信息与上架时间将以蜜女郎官方旗舰店页面为准。"
            />
            <Link href="/products?status=upcoming" className="focus-ring inline-flex items-center gap-1 rounded-full border border-white/12 px-4 py-3 text-sm font-bold text-aura/80 transition hover:bg-white/8 hover:text-white">
              查看新品预告
              <span aria-hidden>›</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {upcomingProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14 md:py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Active Selection"
            title="精选在售产品"
            description="从不同产品类型与关注重点出发，了解蜜女郎当前已开放展示的在售商品。"
          />
          <Link href="/products?status=active" className="focus-ring inline-flex items-center gap-1 rounded-full border border-white/12 px-4 py-3 text-sm font-bold text-aura/80 transition hover:bg-white/8 hover:text-white">
            只看已上架
            <span aria-hidden>›</span>
          </Link>
        </div>
        {activeProducts.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {activeProducts.map((product) => (
              <ProductCard key={product.slug} product={product} compact />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.045] p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-mint-300">Active Selection</p>
            <h3 className="mt-3 text-2xl font-black text-white">在售产品内容正在完善</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-aura/68">
              当前官网先展示已确认适合公开阅读的内容。更多在售产品完成信息整理后，会陆续开放展示。
            </p>
          </div>
        )}
      </section>

      <section className="bg-white/[0.025] py-14 md:py-20">
        <div className="container-shell">
          <SectionHeader
            eyebrow="Browse By Type"
            title="按类型浏览"
            description="分类用于帮助用户从产品类型进入，不等同于材质系列。"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products/category/${category.slug}`}
                className="rounded-[24px] border border-white/10 bg-plum-950/50 p-5 transition hover:-translate-y-1 hover:border-mint-300/34"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Category</p>
                <h3 className="mt-3 text-xl font-black text-white">{category.shortName}</h3>
                <p className="mt-3 text-sm leading-7 text-aura/62">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Trust Path"
          title="官网把信息讲清楚，购买回到官方旗舰店"
          description="先了解品牌、材质与产品区别，再选择天猫或京东官方旗舰店完成购买。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["了解品牌与材质", "比较产品系列", "确认隐私与保养", "选择官方购买渠道"].map((item, index) => (
            <div key={item} className="relative rounded-[26px] border border-white/10 bg-white/[0.055] p-5">
              <p className="text-sm font-black text-mint-300">STEP {index + 1}</p>
              <h3 className="mt-4 text-xl font-black text-white">{item}</h3>
              <p className="mt-3 text-sm leading-7 text-aura/62">
                {index === 0 && "先认识蜜女郎的品牌表达和材质体验方向。"}
                {index === 1 && "从柔感、纹理和入门系列中比较关注重点。"}
                {index === 2 && "查看隐私发货、清洁保养和收纳建议。"}
                {index === 3 && "前往天猫或京东官方旗舰店查看具体商品信息。"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="FAQ Preview"
            title="把购买前关心的问题，先讲清楚"
            description="从材质区别、隐私包装到清洁保养，用清楚、克制的方式回答真实疑问。"
          />
          <div className="grid gap-3">
            {concernCards.map((item) => (
              <div key={item.question} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5">
                <h3 className="text-lg font-black text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-aura/64">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <div className="container-shell">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeader eyebrow="Learn More" title="从材质到清洁，把购买前的问题讲清楚" description="围绕材质体验、产品选择、隐私购买与日常保养，提供更完整的参考信息。" />
            <Link href="/articles" className="focus-ring inline-flex items-center gap-1 rounded-full border border-white/12 px-4 py-3 text-sm font-bold text-aura/80 transition hover:bg-white/8 hover:text-white">
              进入文章栏目
              <span aria-hidden>›</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {publishedArticles.slice(0, 3).map((article) => (
              <Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-[26px] border border-white/10 bg-plum-950/48 p-5 transition hover:-translate-y-1 hover:border-mint-300/34">
                <p className="text-xs font-black text-mint-300">{article.category}</p>
                <h3 className="mt-3 text-xl font-black leading-snug text-white">{article.title}</h3>
                <p className="mt-3 text-sm leading-7 text-aura/62">{article.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="official-buy" className="container-shell scroll-mt-24 py-14 md:py-20">
        <div className="overflow-hidden rounded-[34px] border border-mint-300/22 bg-hero-radial p-6 shadow-glow md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-mint-300">Official Store Channels</p>
            <h2 className="mt-4 text-balance text-3xl font-black text-white md:text-5xl">了解清楚，再前往官方旗舰店购买</h2>
            <p className="mt-4 text-base leading-8 text-aura/70">
              具体商品、价格、优惠、库存、物流与售后服务，以天猫或京东官方旗舰店页面为准。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <StoreButtons source="home_final_cta" />
              <Link href="/buy" className="focus-ring inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-black text-white transition hover:bg-white/8">
                查看购买路径说明
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
