import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const allowedExtensions = new Set(["pdf", "docx", "txt"]);
const maxFileSize = 10 * 1024 * 1024;
const skillCatalog = ["Python", "SQL", "JavaScript", "TypeScript", "HTML", "CSS", "ETL", "ELT", "Pandas", "PySpark", "Scikit-learn", "XGBoost", "Azure", "Azure Machine Learning", "MLflow", "MLOps", "React", "Next.js", "React Native", "Node.js", "REST APIs", "Git", "GitHub", "Jupyter Notebook", "Power BI", "Data pipelines", "Data analysis", "Machine learning"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const resume = formData.get("resume");

  if (!(resume instanceof File)) {
    return NextResponse.json({ error: "Choose a resume file first." }, { status: 400 });
  }

  const extension = resume.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ error: "Upload a PDF, DOCX, or TXT resume." }, { status: 400 });
  }
  if (resume.size > maxFileSize) {
    return NextResponse.json({ error: "Resume must be smaller than 10 MB." }, { status: 400 });
  }

  const uploadDirectory = path.join(process.cwd(), "data", "resumes");
  await mkdir(uploadDirectory, { recursive: true });
  const storedName = `resume-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(await resume.arrayBuffer());
  await writeFile(path.join(uploadDirectory, storedName), fileBuffer);

  let text = "";
  if (extension === "txt") {
    text = fileBuffer.toString("utf8");
  } else if (extension === "pdf") {
    const parser = new PDFParse({ data: fileBuffer });
    text = (await parser.getText()).text;
    await parser.destroy();
  } else if (extension === "docx") {
    text = (await mammoth.extractRawText({ buffer: fileBuffer })).value;
  }
  const lowerText = text.toLowerCase();
  const skills = skillCatalog.filter((skill) => lowerText.includes(skill.toLowerCase()));

  return NextResponse.json({ name: resume.name, size: `${(resume.size / 1024).toFixed(0)} KB`, text, skills });
}
