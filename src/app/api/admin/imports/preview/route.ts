import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole } from "@/lib/cms/auth";
import { previewImportInputWithPublicMetadata } from "@/lib/cms/importers/import-job";

export async function POST(request: Request) {
  try {
    await requireRole(request, ["super_admin", "editor", "reviewer"]);
    const body = (await request.json()) as Record<string, unknown>;
    const urls = typeof body.urls === "string" ? body.urls : "";
    const csv = typeof body.csv === "string" ? body.csv : "";
    const authorized = body.authorized === true;
    const productName = typeof body.product_name === "string" ? body.product_name : "";
    const notes = typeof body.notes === "string" ? body.notes : "";
    const fetchPublicMetadata = body.fetch_public_metadata === true;
    const preview = await previewImportInputWithPublicMetadata({
      urls,
      csv,
      authorized,
      productName,
      notes,
      fetchPublicMetadata,
      primaryCategoryId: typeof body.primary_category_id === "string" ? body.primary_category_id : "",
      subcategoryId: typeof body.subcategory_id === "string" ? body.subcategory_id : "",
      seriesId: typeof body.series_id === "string" ? body.series_id : ""
    });

    return NextResponse.json({
      preview,
      compliance: {
        mode: "public-meta-only",
        noCookies: true,
        noPrivateApis: true,
        noHeadlessBrowser: true,
        noAutoPublish: true,
        createsDraftOnly: true,
        requiresManualAuthorization: true
      }
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
