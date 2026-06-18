import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/cms/auth";
import { adminNavigation, cmsResources } from "@/lib/cms/schema";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ resources: cmsResources, navigation: adminNavigation });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
