import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

type LinkedInJob = { title: string; company: string; location: string; description: string; url: string; source: "linkedin" };

const skillCatalog = ["Python", "SQL", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "REST API", "Git", "Azure", "ETL", "Pandas", "PySpark", "Docker", "AWS", "Java", "C#", "Kubernetes"];
const excludedRolePattern = /product\s*designer|ux|ui|graphic|visual\s*designer|design\s*systems|product\s*manager|marketing|sales|human\s*resources|recruit|finance|account|customer\s*service|senior|staff|principal|lead|manager|director|head|architect/i;
const softwareRolePattern = /software|developer|programmer|backend|back-end|frontend|front-end|full\s*stack|python|javascript|typescript|react|node|api|web developer|azure developer/i;

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

async function latestResumeText() {
  const directory = path.join(process.cwd(), "data", "resumes");
  const files = (await readdir(directory).catch(() => [])).filter((file) => /\.(pdf|docx|txt)$/i.test(file)).sort().reverse();
  if (!files[0]) return "";
  const buffer = await readFile(path.join(directory, files[0]));
  if (files[0].endsWith(".txt")) return buffer.toString("utf8");
  if (files[0].endsWith(".docx")) return (await mammoth.extractRawText({ buffer })).value;
  const parser = new PDFParse({ data: buffer });
  const text = (await parser.getText()).text;
  await parser.destroy();
  return text;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const job = await request.json().catch(() => null) as LinkedInJob | null;
  if (!job?.title || !job.company || !job.description || !job.url) return json({ error: "Structured LinkedIn job details are required." }, 400);
  if (job.description.trim().length < 200) return json({ eligible: false, decision: "INCOMPLETE", reason: "The job description is shorter than 200 characters. Extract the actual LinkedIn job details before analyzing." }, 422);
  const resumeText = await latestResumeText();
  if (!resumeText) return json({ eligible: false, decision: "RESUME REQUIRED", reason: "Upload a resume in Jobflow before analyzing LinkedIn jobs." }, 422);
  const description = job.description.toLowerCase();
  const resume = resumeText.toLowerCase();
  const matchedSkills = skillCatalog.filter((skill) => description.includes(skill.toLowerCase()) && resume.includes(skill.toLowerCase()));
  const jobSkills = skillCatalog.filter((skill) => description.includes(skill.toLowerCase()));
  const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));
  const seniorityMismatch = excludedRolePattern.test(job.title);
  const softwareRole = softwareRolePattern.test(`${job.title} ${job.description}`);
  if (seniorityMismatch || !softwareRole) return json({ eligible: false, decision: "NOT A MATCH", matchScore: Math.min(20, matchedSkills.length * 3), matchedSkills, missingSkills, seniority: seniorityMismatch ? "Not appropriate" : "Unknown", roleCategory: "Not Software Engineering", reason: seniorityMismatch ? "Excluded role category or seniority was detected." : "The job does not contain Software Engineering evidence." });
  const matchScore = Math.min(99, Math.max(35, 55 + matchedSkills.length * 4));
  return json({ eligible: matchScore >= 75, decision: matchScore >= 75 ? "GOOD MATCH" : "POSSIBLE MATCH", matchScore, matchedSkills, missingSkills, seniority: /junior|graduate|entry|associate/i.test(job.title) ? "Junior / Graduate" : "Unknown", roleCategory: "Software Engineering", reason: "Score is based on skills present in both the uploaded resume and structured job description." });
}
