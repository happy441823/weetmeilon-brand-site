import { readPublicCmsRows } from "./public-content";

export type PublicFaq = [string, string];

export async function getPublicFaqs(fallback: PublicFaq[]) {
  const result = await readPublicCmsRows<Record<string, unknown>>("faqs");
  const rows = result.rows
    .map((row): PublicFaq => [String(row.question || ""), String(row.answer || "")])
    .filter(([question, answer]) => question && answer);

  return rows.length > 0 ? rows : fallback;
}
