import { NextResponse } from "next/server";

import { checkAndFireAlerts } from "@/lib/alert-engine";

export async function POST(request: Request) {
  // Verify CRON_SECRET for automated calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id, branch_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const result = await checkAndFireAlerts(org_id, branch_id || null);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Alert check error:", err);
    return NextResponse.json(
      { error: err.message || "Alert check failed" },
      { status: 500 },
    );
  }
}
