import { ImageFrame } from "@/components/ImageFrame";

const detailCards = [
  {
    title: "产品材质细节",
    caption: "用局部实拍呈现表面质感、光泽与细节层次。",
    image: "/images/brand/material-detail.png"
  },
  {
    title: "品牌包装",
    caption: "展示品牌识别、包装信息与日常收纳方式。",
    image: "/images/brand/package.png"
  },
  {
    title: "隐私发货",
    caption: "说明包装与发货信息，具体以官方渠道页面为准。",
    image: "/images/brand/privacy-shipping.png"
  },
  {
    title: "清洁收纳",
    caption: "呈现清洁、晾干与独立收纳的基础场景。",
    image: "/images/brand/care-storage.png"
  }
];

export function BrandDetails() {
  return (
    <section className="container-shell py-12 md:py-16">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-purple md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">BRAND DETAILS</p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white md:text-4xl">真实细节，比口号更有说服力</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-aura/72">
            围绕材质、包装、收货与收纳细节，建立购买前需要的基础信任感。
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {detailCards.map((item) => (
            <article key={item.title} className="group rounded-[24px] border border-white/10 bg-plum-950/42 p-3">
              <ImageFrame
                src={item.image}
                alt={`${item.title}实拍图`}
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw"
                className="aspect-[4/3] rounded-[20px] border border-white/10"
                imageClassName="p-4 group-hover:scale-[1.02]"
              />
              <div className="p-2 pt-4">
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-aura/70">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
