import { NextResponse } from "next/server";
import { adminErrorResponse, getCurrentAdmin, highestRole } from "@/lib/cms/auth";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin(request);
    return NextResponse.json({ admin: { ...admin, highestRole: highestRole(admin) } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
