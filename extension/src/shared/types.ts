export interface LinkedInJob {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  workplaceType?: string;
  salary?: string;
  url: string;
  source: "linkedin";
}

export interface ExtractionDebug {
  title: string;
  company: string;
  location: string;
  descriptionCharacters: number;
  descriptionDetected: boolean;
  eeoExcluded: boolean;
  warning?: string;
}

export interface ExtractedJobPayload {
  job: LinkedInJob;
  debug: ExtractionDebug;
}

export interface AnalyzeResponse {
  eligible: boolean;
  decision: string;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  reason?: string;
}
