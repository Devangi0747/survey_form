"use strict";
(() => {
  // src/content/linkedin-job.ts
  var detailSelectors = [
    "#job-details",
    ".jobs-description__content",
    ".jobs-description-content__text",
    "[class*='jobs-description']",
    "[class*='job-details']"
  ];
  var titleSelectors = ["h1", ".job-details-jobs-unified-top-card__job-title", "[class*='job-title']"];
  var companySelectors = [".job-details-jobs-unified-top-card__company-name", "[class*='company-name']", "a[href*='/company/']"];
  var locationSelectors = [".job-details-jobs-unified-top-card__primary-description-container", "[class*='top-card'] [class*='location']", "[class*='job-location']"];
  var noisyPatterns = /(?:equal opportunity employer|eeo|linkedin corporation|report this job|show more|show less|similar jobs|recommended jobs|sign in|join now|cookie)/i;
  function firstText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = element?.textContent?.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    return "";
  }
  function cleanDescription(raw) {
    const lines = raw.split(/\n|(?<=[.!?])\s{2,}/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    let eeoExcluded = false;
    const kept = lines.filter((line) => {
      if (noisyPatterns.test(line)) {
        if (/equal opportunity|eeo/i.test(line)) eeoExcluded = true;
        return false;
      }
      return line.length > 2;
    });
    return { text: kept.join("\n"), eeoExcluded };
  }
  function extract() {
    const title = firstText(titleSelectors);
    const company = firstText(companySelectors);
    const location = firstText(locationSelectors);
    const detailElement = detailSelectors.map((selector) => document.querySelector(selector)).find(Boolean);
    const fallback = detailElement?.closest("article") ?? document.querySelector("main");
    const rawDescription = detailElement?.textContent ?? fallback?.textContent ?? "";
    const cleaned = cleanDescription(rawDescription);
    const job = { title, company, location, description: cleaned.text, url: window.location.href, source: "linkedin" };
    return { job, debug: { title, company, location, descriptionCharacters: cleaned.text.length, descriptionDetected: cleaned.text.length >= 200, eeoExcluded: cleaned.eeoExcluded, warning: cleaned.text.length < 200 ? "Job description appears incomplete." : void 0 } };
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "EXTRACT_JOB") {
      sendResponse(extract());
      return true;
    }
  });
  var lastUrl = window.location.href;
  var observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      chrome.runtime.sendMessage({ type: "JOB_CHANGED", payload: extract() });
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
})();
