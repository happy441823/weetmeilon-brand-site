import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { getPublishedArticleBySlug, publishedArticles } from "@/lib/articles";
import { canonicalPath } from "@/lib/seo";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return publishedArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: canonicalPath(`/articles/${article.slug}`)
    }
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main>
      <TrackView event="article_read" params={{ article_slug: article.slug, category: article.category }} />
      <article className="container-shell py-14 md:py-20">
        <div className="max-w-4xl">
          <Link href="/articles" className="text-sm font-bold text-mint-300 transition hover:text-white">
            返回文章栏目
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-mint-300/24 bg-mint-300/8 px-3 py-1 text-xs font-bold text-mint-300">{article.category}</span>
            <span className="text-xs text-aura/45">{article.readMinutes} 分钟阅读</span>
          </div>
          <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-white md:text-6xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-9 text-aura/72">{article.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {article.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/10 px-3 py-1 text-xs text-aura/58">
                #{keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.055] p-6 md:p-8">
            <SectionHeader eyebrow="Article" title="正文" />
            {article.renderedHtml ? (
              <div className="cms-richtext mt-7" dangerouslySetInnerHTML={{ __html: article.renderedHtml }} />
            ) : (
              <div className="mt-7 grid gap-8">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-2xl font-black text-white">{section.heading}</h2>
                    <div className="mt-4 grid gap-4 text-sm leading-8 text-aura/68">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
          <aside className="h-fit rounded-[30px] border border-mint-300/20 bg-plum-950/60 p-6">
            <h2 className="text-xl font-black text-white">购买前提醒</h2>
            <p className="mt-3 text-sm leading-7 text-aura/64">
              官网内容用于帮助理解品牌、材质和产品信息。实际商品、优惠、库存、物流与售后规则，以天猫或京东官方旗舰店页面为准。
            </p>
            <div className="mt-5 grid gap-3">
              <StoreButtons source="article_sidebar" />
              <Link href="/faq" className="focus-ring rounded-full border border-white/12 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/8">
                查看常见问题
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
