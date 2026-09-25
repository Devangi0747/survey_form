import { NextResponse } from "next/server";

const excludedRolePattern = /product\s*designer|ux|ui|graphic|visual\s*designer|design\s*systems|product\s*manager|project\s*manager|marketing|sales|human\s*resources|recruit|finance|account|business\s*development|customer\s*service|operations|senior|staff|principal|lead|manager|director|head|architect/i;
const softwareRolePattern = /software|developer|programmer|backend|back-end|frontend|front-end|full\s*stack|python|javascript|typescript|react|node|api|web developer|azure developer/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { url?: string; title?: string; company?: string; location?: string; description?: string } | null;
  if (!body?.url || !body.title || !body.company || !body.description) return NextResponse.json({ error: "Provide the LinkedIn URL, job title, company, and visible job description." }, { status: 400 });
  let parsed: URL;
  try { parsed = new URL(body.url); } catch { return NextResponse.json({ error: "Enter a valid LinkedIn job URL." }, { status: 400 }); }
  if (!/^(www\.)?linkedin\.com$/i.test(parsed.hostname) || !parsed.pathname.startsWith("/jobs/")) return NextResponse.json({ error: "Only LinkedIn job URLs under linkedin.com/jobs are supported." }, { status: 400 });
  if (excludedRolePattern.test(body.title) || !softwareRolePattern.test(`${body.title} ${body.description}`)) return NextResponse.json({ eligible: false, decision: "NOT A MATCH", reason: "This role is not supported as a Software Engineering match." });
  const skillCatalog = ["Python", "SQL", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "REST APIs", "Git", "Azure", "ETL", "Pandas", "PySpark", "Docker", "Scikit-learn"];
  const lowerDescription = body.description.toLowerCase();
  const detectedSkills = skillCatalog.filter((skill) => lowerDescription.includes(skill.toLowerCase()));
  return NextResponse.json({ eligible: true, decision: "READY TO ANALYSE", url: parsed.toString(), title: body.title, company: body.company, location: body.location ?? "Not provided", detectedSkills, missingSkills: skillCatalog.filter((skill) => !detectedSkills.includes(skill)).slice(0, 5) });
}
