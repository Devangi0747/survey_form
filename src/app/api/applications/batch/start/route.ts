import { NextResponse } from "next/server";

type BatchJob = {
  id: number;
  role: string;
  company: string;
  location: string;
  match: number;
};

const excludedRolePattern = /product\s*designer|ux|ui|graphic|visual\s*designer|design\s*systems|product\s*manager|marketing|sales|hr|finance|senior|staff|principal|lead|manager|director|architect/i;
const softwareRolePattern = /software|developer|programmer|backend|frontend|full\s*stack|python|javascript|typescript|react|node|api|web|azure/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { jobs?: BatchJob[]; resumeName?: string } | null;
  const jobs = body?.jobs ?? [];
  if (!body?.resumeName) return NextResponse.json({ error: "Upload a resume before starting a batch." }, { status: 400 });
  if (jobs.length < 1 || jobs.length > 10) return NextResponse.json({ error: "A batch must contain between 1 and 10 eligible jobs." }, { status: 400 });

  const unsuitable = jobs.find((job) => excludedRolePattern.test(job.role) || !softwareRolePattern.test(job.role) || job.match < 75);
  if (unsuitable) return NextResponse.json({ error: `${unsuitable.role} is not an eligible Software Engineering match.` }, { status: 422 });

  const uniqueJobs = new Set(jobs.map((job) => `${job.company.toLowerCase()}::${job.role.toLowerCase()}::${job.location.toLowerCase()}`));
  if (uniqueJobs.size !== jobs.length) return NextResponse.json({ error: "A batch cannot contain duplicate jobs." }, { status: 400 });

  return NextResponse.json({
    id: `batch_${Date.now()}`,
    status: "preparing",
    total: 10,
    resumeName: body.resumeName,
    applications: jobs.map((job, index) => ({ id: `application_${index + 1}`, position: index + 1, job, status: "READY", resumeReady: true, coverLetterReady: true, answersReady: true })),
  }, { status: 201 });
}
