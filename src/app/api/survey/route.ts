import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const responseFile = path.join(process.cwd(), "data", "survey-responses.json");
const exportColumns = ["Participant_ID", "Participant_Name", "Email_Address", "Timestamp", "Consent", "Age_Group", "Current_Status", "Education", "AI_Usage_Frequency", "Main_AI_Use", "Q6_AI_Difficult_Problem", "Q7_AI_When_Can_Solve", "Q8_AI_Suggest_Solutions", "Q9_Less_Confident_Without_AI", "Q10_Difficult_Without_AI", "Q11_Accept_Without_Checking", "Q12_Can_Work_Without_AI", "Q13_Comfortable_Without_AI", "Q14_Check_AI", "Q15_Compare_Sources", "Q16_Question_AI", "Q17_Check_Calculations", "Q18_AI_Limitations", "Q19_Identify_Incorrect_AI", "Q20_Confidence_Without_AI"];
const requiredQuestions = Array.from({ length: 20 }, (_, index) => `Q${index + 1}`);
const validOptions: Record<string, string[]> = {
  Q1: ["18–24", "25–34", "35–44", "45–54", "55+", "Prefer not to say"], Q2: ["Student", "Employed", "Self-employed", "Other", "Prefer not to say"], Q3: ["Secondary education", "Undergraduate", "Master's", "PhD", "Other", "Prefer not to say"], Q4: ["Never", "Rarely", "Sometimes", "Often", "Daily"], Q5: ["Information/search", "Writing", "Study/work", "Coding", "Problem-solving", "Decision-making", "Other"],
};

type SurveyRequest = { submissionKey?: string; consent?: string; name?: string; email?: string; participantId?: string; answers?: Record<string, string> };
type StoredResponse = Omit<SurveyRequest, "answers"> & { answers: Record<string, string>; participantId: string; timestamp: string; scores: { aiDependency: number; independentCapability: number; verification: number; aiLiteracy: number; independentConfidence: number } };

async function readResponses(): Promise<StoredResponse[]> {
  try { return JSON.parse(await readFile(responseFile, "utf8")) as StoredResponse[]; } catch { return []; }
}
function mean(answers: Record<string, string>, questions: string[]) { return Number((questions.reduce((sum, question) => sum + Number(answers[question]), 0) / questions.length).toFixed(2)); }
function responseRow(response: StoredResponse) { return [response.participantId, response.name, response.email, response.timestamp, "Yes, I agree", response.answers.Q1, response.answers.Q2, response.answers.Q3, response.answers.Q4, response.answers.Q5, ...Array.from({ length: 15 }, (_, index) => response.answers[`Q${index + 6}`])]; }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as SurveyRequest | null;
  const answers = body?.answers ?? {};
  if (body?.consent !== "Yes, I agree") return NextResponse.json({ error: "Consent is required to submit this survey." }, { status: 400 });
  if (!body?.submissionKey) return NextResponse.json({ error: "A submission key is required." }, { status: 400 });
  if (!body.name?.trim() || !body.email?.trim() || !body.participantId?.trim()) return NextResponse.json({ error: "Name, email address, and participant ID are required." }, { status: 400 });
  if (requiredQuestions.some((question) => !answers[question])) return NextResponse.json({ error: "Please complete every required question." }, { status: 400 });
  if (answers.Q5 === "Other" && !answers.Q5_other?.trim()) return NextResponse.json({ error: "Please specify your main AI use." }, { status: 400 });
  for (const [question, allowed] of Object.entries(validOptions)) if (!allowed.includes(answers[question] ?? "")) return NextResponse.json({ error: "One of the selected answers is not valid." }, { status: 400 });
  const numericQuestions = requiredQuestions.slice(5);
  if (numericQuestions.some((question) => !/^(?:[1-5])$/.test(answers[question]) && question !== "Q20")) return NextResponse.json({ error: "Please provide valid scale responses." }, { status: 400 });
  if (!/^(?:[0-9]|10)$/.test(answers.Q20)) return NextResponse.json({ error: "Please provide a valid confidence score." }, { status: 400 });
  const responses = await readResponses();
  if (responses.some((response) => response.submissionKey === body.submissionKey)) return NextResponse.json({ error: "This response has already been recorded." }, { status: 409 });
  const stored: StoredResponse = {
    ...body,
    answers,
    participantId: body.participantId.trim(),
    timestamp: new Date().toISOString(),
    scores: { aiDependency: mean(answers, ["Q6", "Q7", "Q8", "Q9", "Q10", "Q11"]), independentCapability: mean(answers, ["Q12", "Q13"]), verification: mean(answers, ["Q14", "Q15", "Q16", "Q17"]), aiLiteracy: mean(answers, ["Q18", "Q19"]), independentConfidence: Number(answers.Q20) },
  };
  try {
    await mkdir(path.dirname(responseFile), { recursive: true });
    await writeFile(responseFile, JSON.stringify([...responses, stored], null, 2), "utf8");
  } catch {
    // Vercel's filesystem is read-only; durable production storage is the Sheet webhook below.
  }
  const sheetsWebhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsWebhook) {
    try {
      const sheetsResponse = await fetch(sheetsWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ columns: exportColumns, row: responseRow(stored) }) });
      if (!sheetsResponse.ok) return NextResponse.json({ error: "Your response could not be added to the research spreadsheet." }, { status: 502 });
    } catch {
      return NextResponse.json({ error: "The research spreadsheet is temporarily unavailable. Please try again." }, { status: 502 });
    }
  }
  return NextResponse.json({ participantId: stored.participantId }, { status: 201 });
}
