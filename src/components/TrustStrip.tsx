const items = [
  { title: "官方旗舰店", text: "官网把信息讲清楚，购买前往天猫或京东官方旗舰店。" },
  { title: "隐私发货说明", text: "包装与发货规则以官方旗舰店页面展示为准。" },
  { title: "材质质感升级", text: "围绕原生肌凝硅讲清柔软、细腻与回弹。" },
  { title: "清洁保养指南", text: "提供使用前后、晾干、收纳等基础建议。" }
];

export function TrustStrip() {
  return (
    <section className="container-shell py-8">
      <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] p-3 backdrop-blur md:grid-cols-4">
        {items.map((item, index) => {
          return (
            <div key={item.title} className="rounded-3xl bg-white/[0.045] p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-mint-300/12 text-xs font-black text-mint-300">0{index + 1}</span>
              <h3 className="mt-3 font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-aura/60">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
