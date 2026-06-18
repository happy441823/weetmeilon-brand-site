import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/cms/auth";
import { dashboardStats } from "@/lib/cms/db";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await dashboardStats());
  } catch (error) {
    return adminErrorResponse(error);
  }
}
