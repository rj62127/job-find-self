"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckSquare, Square, Save, Loader2 } from "lucide-react";

const PLAN = [
  {
    id: "day1",
    label: "Day 1",
    title: "Python + Django Mastery",
    items: [
      "Python internals: GIL, memory management, decorators, generators",
      "Django ORM deep-dive: select_related vs prefetch_related, query optimization",
      "Django Rest Framework: OAuth2, JWT, permissions, throttling",
      "DSA: Arrays + Strings (5-6 medium problems)",
      "Apply: 8-10 jobs (LinkedIn + Naukri + company pages)",
    ],
  },
  {
    id: "day2",
    label: "Day 2",
    title: "Databases & Caching",
    items: [
      "PostgreSQL & MySQL: joins, indexing, query execution plans",
      "Redis: caching strategies, TTL, cache invalidation patterns (Rank Engine)",
      "ClickHouse basics — OLAP vs OLTP difference (Why use it for Rank Engine?)",
      "MSSQL: Custom reconciliation quirks you handled at LUXASIA",
      "DSA: LinkedList + Trees (5-6 problems)",
      "Apply: 8-10 jobs",
    ],
  },
  {
    id: "day3",
    label: "Day 3",
    title: "System Design Fundamentals",
    items: [
      "Multi-tenant SaaS architecture — BuildPiper transition explain karna",
      "Load balancing, horizontal vs vertical scaling, rate limiting",
      "Circuit Breaker & Microservices Architecture",
      "DSA: Recursion + Backtracking basics",
      "Apply: 8-10 jobs",
    ],
  },
  {
    id: "day4",
    label: "Day 4",
    title: "Golang + Concurrency",
    items: [
      "Go basics revision: goroutines, channels, sync package",
      "Log analysis tool (Golang, Cobra CLI) — design explain karna",
      "Python vs Go — kyu use karna hai, clear answer taiyar karo",
      "DSA: Graphs (BFS/DFS) — 4-5 problems",
      "Apply: 8-10 jobs",
    ],
  },
  {
    id: "day5",
    label: "Day 5",
    title: "Project Deep-Dive + GenAI",
    items: [
      "LUXASIA reconciliation platform — pura flow bolna practice",
      "Rank Prediction Engine — 17,000+ users/hour scale explain karo",
      "AI Chatbot & NLP-to-SQL — SpaCy, FinBERT, Bedrock integration",
      "Behavioral: biggest challenge, conflict, why switching (STAR method)",
      "DSA: DP intro (3-4 easy-medium)",
      "Apply: 8-10 jobs",
    ],
  },
  {
    id: "day6",
    label: "Day 6",
    title: "Mock Interview Day",
    items: [
      "Full mock system design: 'Design multi-tenant SaaS platform'",
      "Resume-based rapid fire — kisi bhi bullet ko bina dekhe explain karo",
      "Revise weak DSA topics",
      "LinkedIn profile + GitHub README update",
      "Apply: 8-10 jobs",
    ],
  },
  {
    id: "day7",
    label: "Day 7",
    title: "Consolidate + Rest",
    items: [
      "Sab topics ka quick revision — 1-2 line cheat sheet likh lo",
      "Pending applications follow-up (LinkedIn message/connect)",
      "Mock HR round: salary expectations, notice period",
      "Halka rest lo — burnout na ho",
    ],
  },
];

const STORAGE_KEY = "interview-prep-tracker-v2";

export default function PrepTrackerPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [globalNotes, setGlobalNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setChecked(data.checked || {});
        setNotes(data.notes || {});
        setGlobalNotes(data.globalNotes || "");
      }
    } catch (e) {
      // no saved data yet
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((nextChecked: any, nextNotes: any, nextGlobal: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ checked: nextChecked, notes: nextNotes, globalNotes: nextGlobal })
        );
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (e) {
        setSaveState("idle");
      }
    }, 300);
  }, []);

  const toggleItem = (dayId: string, idx: number) => {
    const key = `${dayId}:${idx}`;
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    persist(next, notes, globalNotes);
  };

  const updateNote = (dayId: string, val: string) => {
    const next = { ...notes, [dayId]: val };
    setNotes(next);
    persist(checked, next, globalNotes);
  };

  const updateGlobalNotes = (val: string) => {
    setGlobalNotes(val);
    persist(checked, notes, val);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const totalItems = PLAN.reduce((sum, d) => sum + d.items.length, 0);
  const doneItems = Object.values(checked).filter(Boolean).length;
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-900/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-blue-400 font-mono text-sm tracking-widest font-bold mb-2 uppercase">Job Hunt Sprint</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
            7-Day Interview Prep Tracker
          </h1>
          
          <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              ></div>
            </div>
            <div className="text-slate-300 font-mono text-sm whitespace-nowrap font-medium">
              {doneItems} / {totalItems} tasks ({pct}%)
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLAN.map((day) => (
          <section key={day.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-slate-700 transition-colors">
            <div className="mb-4">
              <span className="text-xs font-mono text-blue-400 font-bold tracking-wider uppercase bg-blue-900/20 px-2 py-1 rounded">
                {day.label}
              </span>
              <h2 className="text-xl font-bold text-white mt-3 leading-tight">{day.title}</h2>
            </div>
            
            <ul className="space-y-3 flex-1 mb-6">
              {day.items.map((item, idx) => {
                const key = `${day.id}:${idx}`;
                const isChecked = !!checked[key];
                return (
                  <li key={key} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleItem(day.id, idx)}>
                    <div className="mt-1 flex-shrink-0 text-slate-500 group-hover:text-blue-400 transition-colors">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm leading-relaxed transition-colors ${isChecked ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
            
            <textarea
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 resize-none"
              placeholder="Notes — kya reh gaya, kya mushkil laga..."
              value={notes[day.id] || ""}
              onChange={(e) => updateNote(day.id, e.target.value)}
            />
          </section>
        ))}
      </div>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-blue-400" />
          Overall Notes / Pending Items
        </h2>
        <textarea
          className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          placeholder="Yahan likhte jao jo cover nahi hua, follow-ups, company names, feedback..."
          value={globalNotes}
          onChange={(e) => updateGlobalNotes(e.target.value)}
        />
        <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-mono">
          {saveState === "saving" && <span className="text-amber-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
          {saveState === "saved" && <span className="text-green-400">✓ Saved locally</span>}
        </div>
      </section>
    </div>
  );
}
