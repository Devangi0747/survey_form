// src/background/service-worker.ts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "JOB_CHANGED" && sender.tab?.id) {
    chrome.storage.local.set({ currentJob: message.payload, tabId: sender.tab.id });
  }
});
