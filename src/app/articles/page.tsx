import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { getPublishedArticles, groupArticlesForGuideHub, sortArticlesForDisplay } from "@/lib/articles";
import { withCanonical } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = withCanonical({
  title: "内容与科普文章｜蜜女郎 SWEETMEILON",
  description: "蜜女郎内容中心：围绕材质知识、清洁收纳、隐私购买、选购参考与官方渠道，提供清楚克制的购买前参考。"
}, "/articles");

export default async function ArticlesPage() {
  const publishedArticles = sortArticlesForDisplay(await getPublishedArticles());
  const guideGroups = groupArticlesForGuideHub(publishedArticles);

  return (
    <main>
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Content Hub"
          title="选购与护理内容中心"
          description="把购买前最容易纠结的问题按主题整理：材质知识、清洁收纳、隐私购买、选购参考和官方渠道。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {guideGroups.slice(0, 5).map((group) => (
            <a
              key={group.key}
              href={`#${group.key}`}
              className="focus-ring rounded-[24px] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-mint-300/34"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Topic</p>
              <h2 className="mt-3 text-xl font-black text-white">{group.title}</h2>
              <p className="mt-2 text-xs leading-6 text-aura/58">{group.articles.length} 篇指南</p>
            </a>
          ))}
        </div>
        <div className="mt-10 grid gap-8">
          {guideGroups.map((group) => (
            <section key={group.key} id={group.key} className="scroll-mt-24">
              <div className="border-t border-white/10 pt-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-mint-300">Content Topic</p>
                <h2 className="mt-2 text-3xl font-black text-white">{group.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-aura/64">{group.description}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {group.articles.map((article) => (
                  <Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-mint-300/34">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-mint-300/24 bg-mint-300/8 px-3 py-1 text-xs font-bold text-mint-300">{article.category}</span>
                      <span className="text-xs text-aura/45">{article.readMinutes} 分钟阅读</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-black leading-snug text-white">{article.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-aura/64">{article.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.keywords.map((keyword) => (
                        <span key={keyword} className="text-xs text-aura/45">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-8">
          <StoreButtons source="articles_page" />
        </div>
      </section>
    </main>
  );
}
