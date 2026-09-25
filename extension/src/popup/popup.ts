import type { AnalyzeResponse, ExtractedJobPayload } from "../shared/types";

const state = document.querySelector<HTMLDivElement>("#state")!;
const details = document.querySelector<HTMLElement>("#details")!;
const title = document.querySelector<HTMLElement>("#title")!;
const company = document.querySelector<HTMLElement>("#company")!;
const location = document.querySelector<HTMLElement>("#location")!;
const length = document.querySelector<HTMLElement>("#length")!;
const detected = document.querySelector<HTMLElement>("#detected")!;
const eeo = document.querySelector<HTMLElement>("#eeo")!;
const warning = document.querySelector<HTMLElement>("#warning")!;
const result = document.querySelector<HTMLElement>("#result")!;
const analyzeButton = document.querySelector<HTMLButtonElement>("#analyze")!;

function render(payload: ExtractedJobPayload) {
  title.textContent = payload.job.title || "LinkedIn job detected";
  company.textContent = payload.job.company || "Company unavailable";
  location.textContent = payload.job.location || "Location unavailable";
  length.textContent = `${payload.debug.descriptionCharacters} chars`;
  detected.textContent = payload.debug.descriptionDetected ? "YES" : "NO";
  eeo.textContent = payload.debug.eeoExcluded ? "YES" : "NO";
  warning.textContent = payload.debug.warning ?? "";
  details.hidden = false;
  analyzeButton.disabled = !payload.debug.descriptionDetected;
  analyzeButton.title = payload.debug.descriptionDetected ? "Send this job to Jobflow" : "Description must be at least 200 characters";
  analyzeButton.onclick = async () => {
    result.textContent = "Analyzing against your resume...";
    result.className = "";
    const response = await fetch("http://localhost:3000/api/linkedin/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload.job) });
    const analyzed = await response.json() as AnalyzeResponse;
    result.textContent = analyzed.eligible ? `${analyzed.decision}: ${analyzed.matchScore}% match. Matched: ${analyzed.matchedSkills?.join(", ") || "none"}` : analyzed.reason ?? "Not a match";
    result.className = analyzed.eligible ? "success" : "error";
  };
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab?.id || !tab.url?.includes("linkedin.com/jobs/")) { state.textContent = "Open a LinkedIn job page first."; return; }
  chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_JOB" }, (payload: ExtractedJobPayload) => {
    if (chrome.runtime.lastError || !payload) { state.textContent = "Unable to read this LinkedIn job page."; return; }
    state.hidden = true;
    render(payload);
  });
});
