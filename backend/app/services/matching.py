import re


def _words(value: str) -> set[str]:
    return {word.lower() for word in re.findall(r"[a-zA-Z0-9+#.-]+", value) if len(word) > 1}


def score_match(resume_text: str, title: str, location: str | None, required: list[str], preferred: list[str], profile_location: str | None = None) -> dict:
    resume_words = _words(resume_text)
    required_words = _words(" ".join(required))
    preferred_words = _words(" ".join(preferred))
    matched = sorted(resume_words & (required_words | preferred_words))
    missing_required = sorted(required_words - resume_words)
    missing_preferred = sorted(preferred_words - resume_words)
    skills = round((len(required_words & resume_words) / len(required_words) * 85 if required_words else 85) + (len(preferred_words & resume_words) / len(preferred_words) * 15 if preferred_words else 15))
    title_words = _words(title)
    title_score = round(len(title_words & resume_words) / len(title_words) * 100) if title_words else 0
    location_score = 100 if not location or not profile_location or profile_location.lower() in location.lower() else 60
    experience_score = 80 if any(word in resume_words for word in {"senior", "lead", "staff", "experience"}) else 65
    overall = round(skills * .4 + experience_score * .25 + 80 * .1 + location_score * .1 + title_score * .1 + 70 * .05)
    return {"overall": min(overall, 100), "skills": skills, "experience": experience_score, "location": location_score, "title": title_score, "matched_skills": matched, "missing_required": missing_required, "missing_preferred": missing_preferred}
