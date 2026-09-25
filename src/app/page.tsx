"use client";

import { useMemo, useState } from "react";

const likertOptions = ["1", "2", "3", "4", "5"];
const likertLabels = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
const sections = [
  { title: "About You", questions: ["Q1", "Q2", "Q3"] },
  { title: "Your AI Use", questions: ["Q4", "Q5"] },
  { title: "AI Dependency", questions: ["Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13"] },
  { title: "Verification Behaviour", questions: ["Q14", "Q15", "Q16", "Q17"] },
  { title: "AI Literacy", questions: ["Q18", "Q19"] },
  { title: "Confidence", questions: ["Q20"] },
];
const questionLabels: Record<string, string> = {
  Q1: "What is your age group?", Q2: "What is your current status?", Q3: "What is your highest education level?",
  Q4: "How often do you use generative AI such as ChatGPT, Gemini or Copilot?", Q5: "What do you mainly use generative AI for?",
  Q6: "I use AI when I have a difficult problem.", Q7: "I use AI even when I could solve the problem myself.", Q8: "I rely on AI to suggest solutions.", Q9: "I feel less confident when AI is unavailable.", Q10: "Some tasks would be difficult for me without AI.", Q11: "I sometimes accept AI answers without checking them.", Q12: "I can complete important tasks without AI.", Q13: "I feel comfortable working independently when AI is unavailable.", Q14: "I check AI-generated information before using it.", Q15: "I compare important AI answers with other sources.", Q16: "I question AI when its answer seems incorrect.", Q17: "I check calculations provided by AI.", Q18: "I understand the limitations of generative AI.", Q19: "I know how to identify potentially incorrect AI-generated information.", Q20: "How confident are you that you could solve a new problem without AI?",
};
const options: Record<string, string[]> = {
  Q1: ["18–24", "25–34", "35–44", "45–54", "55+", "Prefer not to say"], Q2: ["Student", "Employed", "Self-employed", "Other", "Prefer not to say"], Q3: ["Secondary education", "Undergraduate", "Master's", "PhD", "Other", "Prefer not to say"], Q4: ["Never", "Rarely", "Sometimes", "Often", "Daily"], Q5: ["Information/search", "Writing", "Study/work", "Coding", "Problem-solving", "Decision-making", "Other"],
};
type Answers = Record<string, string>;

function getSubmissionKey() {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem("survey-submission-key");
  if (existing) return existing;
  const key = crypto.randomUUID();
  window.sessionStorage.setItem("survey-submission-key", key);
  return key;
}

export default function Home() {
  const [consent, setConsent] = useState("");
  const [participantDetails, setParticipantDetails] = useState({ name: "", email: "", participantId: "" });
  const [answers, setAnswers] = useState<Answers>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentSection = sections[sectionIndex];
  const progress = Math.round(((sectionIndex + 1) / sections.length) * 100);
  const setAnswer = (question: string, value: string) => setAnswers((current) => ({ ...current, [question]: value }));
  const unanswered = useMemo(() => currentSection.questions.filter((question) => !answers[question]), [answers, currentSection]);
  function beginSurvey() { if (consent !== "Yes, I agree") { setNotice("Thank you for your interest. You have chosen not to participate."); return; } setNotice(""); }
  function nextSection() { if (sectionIndex === 0 && (!participantDetails.name.trim() || !participantDetails.email.trim() || !participantDetails.participantId.trim())) { setNotice("Please complete your name, email address, and participant ID before continuing."); return; } if (unanswered.length) { setNotice("Please answer the required question before continuing."); return; } setNotice(""); setSectionIndex((current) => Math.min(current + 1, sections.length - 1)); }
  async function submitSurvey() {
    if (unanswered.length) { setNotice("Please answer the required question before submitting."); return; }
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionKey: getSubmissionKey(), consent, ...participantDetails, answers }) });
      const result = await response.json().catch(() => ({ error: "The survey service returned an invalid response. Please try again." }));
      if (!response.ok) throw new Error(result.error ?? "Your response could not be recorded.");
      window.localStorage.setItem("survey-completed", "true"); setSubmitted(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Your response could not be recorded."); } finally { setSaving(false); }
  }
  if (submitted) return <main className="survey-shell"><div className="survey-card thank-you"><p className="research-label">Pilot study</p><h1>Thank you for participating.</h1><p>Your response has been recorded. Your contribution will help investigate how people use generative AI and how independent performance may change when AI assistance is unavailable.</p></div></main>;
  if (notice && consent === "No, I do not agree") return <main className="survey-shell"><div className="survey-card thank-you"><p className="research-label">Human–AI Dependency and Cognitive Resilience Survey</p><h1>{notice}</h1></div></main>;
  return <main className="survey-shell"><div className="survey-wrap">
    <header className="survey-header"><p className="research-label">PhD research · Pilot questionnaire</p><h1>Human–AI Dependency and Cognitive Resilience Survey</h1><p>“This survey is part of a research study investigating how people use generative AI and how confident they feel when completing tasks without AI. Participation is voluntary. Responses will be used for research purposes and analysed anonymously/pseudonymously in accordance with the approved research protocol.”</p></header>
    {!consent || notice ? <section className="survey-card consent-card"><h2>Before you begin</h2><p className="required-note">Your participation is voluntary. No unnecessary personally identifiable information is collected.</p><fieldset><legend>I agree to participate in this research study. <span>*</span></legend>{["Yes, I agree", "No, I do not agree"].map((value) => <label className="choice" key={value}><input type="radio" name="consent" value={value} checked={consent === value} onChange={(event) => { setConsent(event.target.value); setNotice(""); }} />{value}</label>)}</fieldset>{notice && <p className="form-error" role="alert">{notice}</p>}<button className="primary-button" onClick={beginSurvey} disabled={!consent}>Continue <span>→</span></button></section> : <>
      <div className="progress-header"><span>Section {sectionIndex + 1} of {sections.length}</span><span>{progress}% complete</span></div><div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
      <section className="survey-card question-card"><div className="section-heading"><p className="research-label">Section {sectionIndex + 1}</p><h2>{currentSection.title}</h2></div>{sectionIndex === 0 && <div className="participant-details"><p className="details-heading">Participant details <span>*</span></p><label>Name<input value={participantDetails.name} onChange={(event) => setParticipantDetails({ ...participantDetails, name: event.target.value })} /></label><label>Email address<input type="email" value={participantDetails.email} onChange={(event) => setParticipantDetails({ ...participantDetails, email: event.target.value })} /></label><label>Participant ID<input value={participantDetails.participantId} onChange={(event) => setParticipantDetails({ ...participantDetails, participantId: event.target.value })} /></label></div>}{currentSection.questions.map((question) => <Question key={question} question={question} value={answers[question] ?? ""} onChange={setAnswer} />)}{notice && <p className="form-error" role="alert">{notice}</p>}<div className="form-actions">{sectionIndex > 0 && <button className="secondary-button" onClick={() => { setNotice(""); setSectionIndex((current) => current - 1); }}>Back</button>}{sectionIndex < sections.length - 1 ? <button className="primary-button" onClick={nextSection}>Next <span>→</span></button> : <button className="primary-button" onClick={submitSurvey} disabled={saving}>{saving ? "Recording..." : "Submit response"} <span>→</span></button>}</div></section><p className="survey-footer">Required questions are marked with *. Your response is saved only when you submit the completed survey.</p>
    </>}
  </div></main>;
}

function Question({ question, value, onChange }: { question: string; value: string; onChange: (question: string, value: string) => void }) {
  const isLikert = /^Q([6-9]|1[0-9])$/.test(question) && question !== "Q20";
  const isScale = question === "Q20";
  return <fieldset className="question-block"><legend><span className="question-number">{question.replace("Q", "Question ")}</span>{questionLabels[question]} <span>*</span></legend>{isLikert ? <div className="likert" role="radiogroup" aria-label={questionLabels[question]}>{likertOptions.map((option, index) => <label className="likert-option" key={option}><input type="radio" name={question} value={option} checked={value === option} onChange={() => onChange(question, option)} /><span>{option}</span><small>{likertLabels[index]}</small></label>)}</div> : isScale ? <div className="scale"><div className="scale-labels"><span>0 · Not confident at all</span><span>10 · Extremely confident</span></div><input type="range" min="0" max="10" step="1" value={value || "0"} onChange={(event) => onChange(question, event.target.value)} aria-label={questionLabels[question]} /><output>{value || "0"}</output></div> : <div className="choices">{options[question].map((option) => <label className="choice" key={option}><input type="radio" name={question} value={option} checked={value === option} onChange={() => onChange(question, option)} />{option}</label>)}{question === "Q5" && value === "Other" && <input className="other-input" aria-label="Other generative AI use" placeholder="Please specify" onChange={(event) => onChange("Q5_other", event.target.value)} />}</div>}</fieldset>;
}
