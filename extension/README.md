# Jobflow LinkedIn Bridge

This Manifest V3 Chrome extension is the safe bridge between a LinkedIn job page and the local Jobflow app.

## Build and load

From the repository root:

```powershell
cd extension
npm install
npm run build
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `extension/dist`.

Open a LinkedIn page under `https://www.linkedin.com/jobs/`, open a job, click the Jobflow extension, and choose **ANALYZE JOB**. The content script reads targeted visible job-details elements only. It does not read unrelated sites, collect credentials, bypass challenges, or submit applications.

The popup refuses to send descriptions shorter than 200 characters. It reports extracted character count and EEO exclusion status so incomplete extraction is visible.
