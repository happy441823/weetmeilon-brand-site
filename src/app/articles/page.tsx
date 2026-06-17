import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { getPublishedArticles } from "@/lib/articles";
import { withCanonical } from "@/lib/seo";

export const metadata: Metadata = withCanonical({
  title: "内容与科普文章",
  description: "蜜女郎科普文章：围绕材质体验、产品选择、隐私购买与日常保养，提供更清楚的购买前参考。"
}, "/articles");

export default async function ArticlesPage() {
  const publishedArticles = await getPublishedArticles();

  return (
    <main>
      <section className="container-shell py-14 md:py-20">
        <SectionHeader
          eyebrow="Content Hub"
          title="把购买前的问题，讲得更清楚"
          description="围绕材质体验、产品选择、隐私购买与日常保养，提供更深入、可阅读的参考内容。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {publishedArticles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-mint-300/34">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-mint-300/24 bg-mint-300/8 px-3 py-1 text-xs font-bold text-mint-300">{article.category}</span>
                <span className="text-xs text-aura/45">{article.readMinutes} 分钟阅读</span>
              </div>
              <h2 className="mt-4 text-2xl font-black leading-snug text-white">{article.title}</h2>
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
        <div className="mt-8">
          <StoreButtons source="articles_page" />
        </div>
      </section>
    </main>
  );
}
