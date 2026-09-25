import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

type StoredResponse = { participantId: string; name?: string; email?: string; timestamp: string; answers: Record<string, string>; scores: { aiDependency: number; independentCapability: number; verification: number; aiLiteracy: number; independentConfidence: number } };
const responseFile = path.join(process.cwd(), "data", "survey-responses.json");

function authorized(request: Request) { const token = process.env.RESEARCHER_DASHBOARD_TOKEN; return Boolean(token && request.headers.get("x-researcher-token") === token); }
async function readResponses(): Promise<StoredResponse[]> { try { return JSON.parse(await readFile(responseFile, "utf8")) as StoredResponse[]; } catch { return []; } }
function distribution(responses: StoredResponse[], question: string) { return responses.reduce<Record<string, number>>((counts, response) => { const value = response.answers[question]; counts[value] = (counts[value] ?? 0) + 1; return counts; }, {}); }
function average(responses: StoredResponse[], key: keyof StoredResponse["scores"]) { return responses.length ? Number((responses.reduce((sum, response) => sum + response.scores[key], 0) / responses.length).toFixed(2)) : 0; }
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

const columns = ["Participant_ID", "Participant_Name", "Email_Address", "Timestamp", "Consent", "Age_Group", "Current_Status", "Education", "AI_Usage_Frequency", "Main_AI_Use", "Q6_AI_Difficult_Problem", "Q7_AI_When_Can_Solve", "Q8_AI_Suggest_Solutions", "Q9_Less_Confident_Without_AI", "Q10_Difficult_Without_AI", "Q11_Accept_Without_Checking", "Q12_Can_Work_Without_AI", "Q13_Comfortable_Without_AI", "Q14_Check_AI", "Q15_Compare_Sources", "Q16_Question_AI", "Q17_Check_Calculations", "Q18_AI_Limitations", "Q19_Identify_Incorrect_AI", "Q20_Confidence_Without_AI"];
function toCsv(responses: StoredResponse[]) { return [columns, ...responses.map((response) => [response.participantId, response.name, response.email, response.timestamp, "Yes, I agree", response.answers.Q1, response.answers.Q2, response.answers.Q3, response.answers.Q4, response.answers.Q5, ...Array.from({ length: 15 }, (_, index) => response.answers[`Q${index + 6}`])])].map((row) => row.map(csvCell).join(",")).join("\n"); }
function toWorkbook(responses: StoredResponse[]) { const rows = responses.map((response) => [response.participantId, response.name, response.email, response.timestamp, "Yes, I agree", response.answers.Q1, response.answers.Q2, response.answers.Q3, response.answers.Q4, response.answers.Q5, ...Array.from({ length: 15 }, (_, index) => response.answers[`Q${index + 6}`])]); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([columns, ...rows]), "Survey Responses"); return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }); }

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Researcher authorization is required." }, { status: 401 });
  const responses = await readResponses();
  if (new URL(request.url).searchParams.get("format") === "xlsx") return new Response(toWorkbook(responses), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=survey-responses.xlsx" } });
  if (new URL(request.url).searchParams.get("format") === "csv") return new Response(toCsv(responses), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=survey-responses.csv" } });
  const consentRate = responses.length ? 100 : 0;
  return NextResponse.json({ responseCount: responses.length, consentRate, completionRate: responses.length ? 100 : 0, usageDistribution: distribution(responses, "Q4"), scores: { aiDependency: average(responses, "aiDependency"), independentCapability: average(responses, "independentCapability"), verification: average(responses, "verification"), aiLiteracy: average(responses, "aiLiteracy"), independentConfidence: average(responses, "independentConfidence") } });
}
