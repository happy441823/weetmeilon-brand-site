import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole } from "@/lib/cms/auth";
import { fetchPublicMetadata } from "@/lib/cms/importers/metadata-fetcher";
import { previewImportInput } from "@/lib/cms/importers/import-job";

export async function POST(request: Request) {
  try {
    await requireRole(request, ["super_admin", "editor", "reviewer"]);
    const body = (await request.json()) as Record<string, unknown>;
    const shouldFetch = body.fetch_public_metadata === true;
    const urls = typeof body.urls === "string" ? body.urls : "";
    const csv = typeof body.csv === "string" ? body.csv : "";
    const authorized = body.authorized === true;
    const productName = typeof body.product_name === "string" ? body.product_name : "";
    const notes = typeof body.notes === "string" ? body.notes : "";
    const preview = previewImportInput({ urls, csv, authorized, productName, notes });

    if (shouldFetch && preview.length === 1 && preview[0].errors.length === 0) {
      try {
        const metadata = await fetchPublicMetadata(preview[0].sourceUrl);
        preview[0] = {
          ...preview[0],
          titleDetected: metadata.titleDetected || preview[0].titleDetected,
          metadata
        };
      } catch (error) {
        preview[0].errors.push(error instanceof Error ? error.message : "公开 metadata 读取失败。");
      }
    }

    return NextResponse.json({
      preview,
      compliance: {
        mode: "public-meta-only",
        noCookies: true,
        noPrivateApis: true,
        noHeadlessBrowser: true,
        requiresManualAuthorization: true
      }
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
