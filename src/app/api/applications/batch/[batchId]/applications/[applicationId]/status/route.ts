import { NextResponse } from "next/server";

const allowedStatuses = new Set(["OPENED", "SUBMITTED", "SKIPPED", "FAILED"]);

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string; applicationId: string }> }) {
  const { batchId, applicationId } = await params;
  const body = await request.json().catch(() => null) as { status?: string } | null;
  if (!allowedStatuses.has(body?.status ?? "")) return NextResponse.json({ error: "Unsupported application status." }, { status: 400 });
  return NextResponse.json({ batchId, applicationId, status: body?.status, updatedAt: new Date().toISOString(), message: body?.status === "SUBMITTED" ? "Recorded after explicit user confirmation." : "Application status updated." });
}
