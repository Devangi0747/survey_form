import type { ExtractedJobPayload } from "../shared/types";

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "JOB_CHANGED" && sender.tab?.id) {
    chrome.storage.local.set({ currentJob: message.payload as ExtractedJobPayload, tabId: sender.tab.id });
  }
});
