import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { createImportJobs } from "@/lib/cms/importers/import-job";

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin", "editor"]);
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createImportJobs(
      {
        urls: typeof body.urls === "string" ? body.urls : "",
        csv: typeof body.csv === "string" ? body.csv : "",
        authorized: body.authorized === true,
        productName: typeof body.product_name === "string" ? body.product_name : "",
        category: typeof body.category === "string" ? body.category : "",
        series: typeof body.series === "string" ? body.series : "",
        primaryCategoryId: typeof body.primary_category_id === "string" ? body.primary_category_id : "",
        subcategoryId: typeof body.subcategory_id === "string" ? body.subcategory_id : "",
        seriesId: typeof body.series_id === "string" ? body.series_id : "",
        notes: typeof body.notes === "string" ? body.notes : "",
        fetchPublicMetadata: body.fetch_public_metadata === true
      },
      admin.id
    );
    await writeAuditLog({
      request,
      actor: admin,
      action: "create_import_jobs",
      entityType: "import_jobs",
      summary: `创建导入任务 ${result.created.length}/${result.total}`
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
