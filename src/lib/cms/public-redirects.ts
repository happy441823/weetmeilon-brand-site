import { readPublicCmsRows } from "./public-content";

export type PublicRedirectRow = {
  source_path: string;
  destination_path: string;
  status_code: number;
};

function normalizePath(value: unknown) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (/[\u0000-\u001f\u007f]/.test(path)) return null;
  if (/^\/(?:admin|api)(?:\/|$)/i.test(path)) return null;
  return path;
}

export function validatePublicRedirect(row: PublicRedirectRow) {
  const source = normalizePath(row.source_path);
  const destination = normalizePath(row.destination_path);
  const status = Number(row.status_code);
  if (!source || !destination) return null;
  if (source === destination) return null;
  if (status !== 301 && status !== 302) return null;
  return { source, destination, status };
}

export async function getPublicRedirectForPath(pathname: string) {
  const source = normalizePath(pathname);
  if (!source) return null;
  const result = await readPublicCmsRows<PublicRedirectRow>("redirects");
  if (result.source !== "d1") return null;

  const redirects = new Map<string, { destination: string; status: 301 | 302 }>();
  for (const row of result.rows) {
    const redirect = validatePublicRedirect(row);
    if (redirect) {
      redirects.set(redirect.source, { destination: redirect.destination, status: redirect.status as 301 | 302 });
    }
  }

  const matched = redirects.get(source);
  if (!matched) return null;

  const seen = new Set([source]);
  let next = matched.destination;
  while (redirects.has(next)) {
    if (seen.has(next)) return null;
    seen.add(next);
    next = redirects.get(next)?.destination || next;
  }

  return matched;
}
