"use client";

import { useMemo, useState } from "react";

type Job = {
  id: number;
  company: string;
  role: string;
  location: string;
  mode: string;
  salary: string;
  match: number;
  age: string;
  accent: string;
  initials: string;
};

const jobs: Job[] = [
  { id: 1, company: "Northstar Labs", role: "Senior Product Designer", location: "New York, NY", mode: "Remote", salary: "$145k - $175k", match: 96, age: "2h ago", accent: "coral", initials: "N" },
  { id: 2, company: "Lumen Health", role: "Product Designer", location: "Boston, MA", mode: "Hybrid", salary: "$120k - $150k", match: 91, age: "4h ago", accent: "blue", initials: "L" },
  { id: 3, company: "Paperplane", role: "Design Systems Lead", location: "Remote, US", mode: "Remote", salary: "$135k - $165k", match: 87, age: "6h ago", accent: "yellow", initials: "P" },
  { id: 4, company: "Common Thread", role: "Staff UX Designer", location: "Chicago, IL", mode: "Hybrid", salary: "$130k - $160k", match: 82, age: "1d ago", accent: "green", initials: "C" },
];

export default function Home() {
  const [selectedId, setSelectedId] = useState(1);
  const [shortlisted, setShortlisted] = useState<number[]>([2]);
  const [notes, setNotes] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedId) ?? jobs[0], [selectedId]);

  function toggleShortlist(id: number) {
    setShortlisted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">JF</span><span>Jobflow</span></div>
        <p className="eyebrow">Workspace</p>
        <nav className="nav-list" aria-label="Main navigation">
          <button className="nav-item active"><span className="nav-icon">01</span>Daily review <span className="nav-count">4</span></button>
          <button className="nav-item"><span className="nav-icon">02</span>Shortlisted <span className="nav-count muted">{shortlisted.length}</span></button>
          <button className="nav-item"><span className="nav-icon">03</span>Applications</button>
        </nav>
        <div className="sidebar-bottom">
          <p className="eyebrow">Your profile</p>
          <button className="profile-card" onClick={() => setProfileSaved(false)}><span className="avatar">AM</span><span><strong>Alex Morgan</strong><small>Product designer</small></span><span className="dots">...</span></button>
          <button className="settings-link"><span>Settings</span><span>></span></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar"><div><p className="kicker">Thursday, August 21, 2026</p><h1>Your daily review</h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">o</button><button className="run-button" onClick={() => setProfileSaved(true)}><span className="pulse-dot" />Run today&apos;s scan</button></div></header>
        <div className="status-strip"><div><span className="status-check">OK</span><strong>Morning scan complete</strong><span className="status-detail">4 new roles match your profile</span></div><span className="scan-time">Last scanned 8:14 AM</span></div>

        <div className="workspace-grid">
          <section className="matches-panel">
            <div className="section-heading"><div><p className="kicker">Recommended for you</p><h2>New matches <span>4</span></h2></div><button className="filter-button">Best match <span>v</span></button></div>
            <div className="job-list">{jobs.map((job) => <article key={job.id} className={`job-row ${selectedId === job.id ? "selected" : ""}`} onClick={() => setSelectedId(job.id)}>
              <div className={`company-logo ${job.accent}`}>{job.initials}</div><div className="job-copy"><div className="job-title-line"><h3>{job.role}</h3><span className="match-pill">{job.match}%</span></div><p>{job.company}</p><div className="job-meta"><span>{job.location}</span><span>{job.mode}</span><span>{job.salary}</span></div></div><button className={`bookmark ${shortlisted.includes(job.id) ? "saved" : ""}`} onClick={(event) => { event.stopPropagation(); toggleShortlist(job.id); }} aria-label={`Shortlist ${job.role}`}>{shortlisted.includes(job.id) ? "Saved" : "Save"}</button>
            </article>)}</div>
            <button className="load-button">View all matches <span>-></span></button>
          </section>

          <section className="detail-panel"><div className="detail-top"><div className={`company-logo large ${selectedJob.accent}`}>{selectedJob.initials}</div><button className="close-button">x</button></div><p className="kicker">{selectedJob.company}</p><h2>{selectedJob.role}</h2><p className="detail-location">{selectedJob.location} <span>·</span> {selectedJob.mode}</p><div className="detail-tags"><span>{selectedJob.salary}</span><span>Full-time</span></div><div className="fit-score"><div><p className="kicker">Profile fit</p><strong>{selectedJob.match}%</strong></div><div className="score-ring" style={{ "--score": `${selectedJob.match * 3.6}deg` } as React.CSSProperties}><span>{selectedJob.match}</span></div></div><div className="detail-section"><h3>Why it fits</h3><p>Strong overlap with your product strategy and design systems experience. The team is building tools for a thoughtful, growing customer base.</p></div><div className="detail-section"><h3>Key signals</h3><ul><li>Design systems ownership</li><li>Cross-functional product work</li><li>Remote-friendly team</li></ul></div><div className="draft-box"><label htmlFor="notes">Private application notes</label><textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a reminder for your application..." /><button className="draft-button" onClick={() => setProfileSaved(true)}>{profileSaved ? "Notes saved" : "Save notes"}</button></div><button className="review-button" onClick={() => setProfileSaved(true)}>Review application <span>-></span></button><p className="manual-note">You approve every application before anything is submitted.</p></section>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
