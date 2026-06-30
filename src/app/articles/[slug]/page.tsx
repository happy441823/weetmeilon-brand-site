import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  getRelatedArticlesForArticle,
  getRelatedProductsForArticle,
  publishedArticles
} from "@/lib/articles";
import { getPublicCatalogProducts } from "@/lib/catalog";
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

  const [allArticles, publicProducts] = await Promise.all([getPublishedArticles(), Promise.resolve(getPublicCatalogProducts())]);
  const relatedArticles = getRelatedArticlesForArticle(article, allArticles, 3);
  const relatedProducts = getRelatedProductsForArticle(article, publicProducts, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    keywords: article.keywords.join(", "),
    articleSection: article.category,
    author: {
      "@type": "Organization",
      name: "蜜女郎 SWEETMEILON"
    },
    publisher: {
      "@type": "Organization",
      name: "蜜女郎 SWEETMEILON"
    },
    mainEntityOfPage: canonicalPath(`/articles/${article.slug}`)
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
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
              官网内容用于帮助理解品牌、材质和产品信息。实际商品规格、发货、物流与售后规则，以天猫或京东官方旗舰店页面为准。
            </p>
            <div className="mt-5 grid gap-3">
              <StoreButtons source="article_sidebar" />
              <Link href="/faq" className="focus-ring rounded-full border border-white/12 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/8">
                查看常见问题
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-12">
          <SectionHeader eyebrow="Related Guides" title="继续了解" description="围绕同一购买前问题，继续查看材质、清洁、隐私和官方渠道说明。" />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {relatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.slug}
                href={`/articles/${relatedArticle.slug}`}
                className="focus-ring rounded-[28px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-mint-300/40 hover:bg-white/[0.07]"
              >
                <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">{relatedArticle.category}</p>
                <h2 className="mt-4 text-xl font-black leading-snug text-white">{relatedArticle.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-aura/64">{relatedArticle.description}</p>
                <span className="mt-5 inline-flex text-sm font-black text-mint-300">阅读文章</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionHeader eyebrow="Related Products" title="相关商品入口" description="文章只提供购买前说明，具体规格、发货和售后信息请以官方旗舰店页面为准。" />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {relatedProducts.map((product) => (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className="focus-ring overflow-hidden rounded-[28px] border border-white/10 bg-plum-950/50 transition hover:-translate-y-1 hover:border-mint-300/40"
              >
                <ImageFrame src={product.coverImage} alt={product.imageAlt} sizes="(min-width: 768px) 28vw, 92vw" className="aspect-[4/3]" imageClassName="p-5" />
                <div className="p-6">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-mint-300">{product.status === "upcoming" ? "Preview" : "Product"}</p>
                  <h2 className="mt-3 text-xl font-black leading-snug text-white">{product.displayName}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-aura/64">{product.shortDescription}</p>
                  <span className="mt-5 inline-flex text-sm font-black text-mint-300">查看商品</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <nav className="mt-12 grid gap-3 md:grid-cols-3" aria-label="购买前信息入口">
          <Link href="/products" className="focus-ring rounded-full border border-white/12 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white/8">
            产品中心
          </Link>
          <Link href="/guide" className="focus-ring rounded-full border border-white/12 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white/8">
            清洁指南
          </Link>
          <Link href="/privacy-shipping" className="focus-ring rounded-full border border-white/12 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white/8">
            隐私发货
          </Link>
        </nav>
      </article>
    </main>
  );
}
