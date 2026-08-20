"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckSquare, Square, Save, Loader2, Table2, Plus, Trash2, X } from "lucide-react";

interface FeedbackRow {
  id: string;
  topic: string;
  current: string;
  knows: string;
  improvement: string;
}

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
  const [feedback, setFeedback] = useState<Record<string, FeedbackRow[]>>({});
  const [globalNotes, setGlobalNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setChecked(data.checked || {});
        setFeedback(data.feedback || {});
        setGlobalNotes(data.globalNotes || "");
      }
    } catch (e) {
      // no saved data yet
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((nextChecked: any, nextFeedback: any, nextGlobal: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ checked: nextChecked, feedback: nextFeedback, globalNotes: nextGlobal })
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
    persist(next, feedback, globalNotes);
  };

  const updateGlobalNotes = (val: string) => {
    setGlobalNotes(val);
    persist(checked, feedback, val);
  };
  
  const handleAddRow = (dayId: string) => {
    const newRow: FeedbackRow = { id: Date.now().toString(), topic: "", current: "", knows: "", improvement: "" };
    const nextFeedback = { ...feedback, [dayId]: [...(feedback[dayId] || []), newRow] };
    setFeedback(nextFeedback);
    persist(checked, nextFeedback, globalNotes);
  };
  
  const handleUpdateRow = (dayId: string, rowId: string, field: keyof FeedbackRow, value: string) => {
    const rows = feedback[dayId] || [];
    const updatedRows = rows.map(r => r.id === rowId ? { ...r, [field]: value } : r);
    const nextFeedback = { ...feedback, [dayId]: updatedRows };
    setFeedback(nextFeedback);
    persist(checked, nextFeedback, globalNotes);
  };
  
  const handleDeleteRow = (dayId: string, rowId: string) => {
    const rows = feedback[dayId] || [];
    const updatedRows = rows.filter(r => r.id !== rowId);
    const nextFeedback = { ...feedback, [dayId]: updatedRows };
    setFeedback(nextFeedback);
    persist(checked, nextFeedback, globalNotes);
  };
  
  const openModal = (dayId: string) => {
    setSelectedDay(dayId);
    setIsModalOpen(true);
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
            
            <button
              onClick={() => openModal(day.id)}
              className="mt-auto w-full py-2.5 px-4 bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-xl text-slate-300 hover:text-blue-400 text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn"
            >
              <Table2 className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-400 transition-colors" />
              Topic Feedback Table
            </button>
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

      {/* Feedback Modal */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-blue-400" />
                  Feedback Table: {PLAN.find(d => d.id === selectedDay)?.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1">Track topics, your current level, what you know, and what needs improvement.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="min-w-[800px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 px-4 text-sm font-semibold text-slate-400 w-1/5">Topic</th>
                      <th className="pb-3 px-4 text-sm font-semibold text-slate-400 w-32">Current</th>
                      <th className="pb-3 px-4 text-sm font-semibold text-slate-400 w-2/5">Kya aata hai (Knowledge)</th>
                      <th className="pb-3 px-4 text-sm font-semibold text-slate-400 w-2/5">Improvement needed</th>
                      <th className="pb-3 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(feedback[selectedDay] || []).map((row) => (
                      <tr key={row.id} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="p-2 align-top">
                          <input 
                            type="text" 
                            value={row.topic} 
                            onChange={(e) => handleUpdateRow(selectedDay, row.id, "topic", e.target.value)}
                            placeholder="e.g. GIL"
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-slate-200 outline-none transition-colors font-medium"
                          />
                        </td>
                        <td className="p-2 align-top">
                          <input 
                            type="text" 
                            value={row.current} 
                            onChange={(e) => handleUpdateRow(selectedDay, row.id, "current", e.target.value)}
                            placeholder="e.g. 6.5/10"
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-amber-400 outline-none transition-colors font-mono"
                          />
                        </td>
                        <td className="p-2 align-top">
                          <textarea 
                            value={row.knows} 
                            onChange={(e) => handleUpdateRow(selectedDay, row.id, "knows", e.target.value)}
                            placeholder="e.g. Basic concept, CPU vs I/O..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-slate-300 outline-none transition-colors resize-none min-h-[60px]"
                          />
                        </td>
                        <td className="p-2 align-top">
                          <textarea 
                            value={row.improvement} 
                            onChange={(e) => handleUpdateRow(selectedDay, row.id, "improvement", e.target.value)}
                            placeholder="e.g. GIL internals, bytecode..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-slate-300 outline-none transition-colors resize-none min-h-[60px]"
                          />
                        </td>
                        <td className="p-2 align-top text-center pt-4">
                          <button 
                            onClick={() => handleDeleteRow(selectedDay, row.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(feedback[selectedDay] || []).length === 0 && (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl my-4">
                    No feedback added yet. Add a topic to start tracking your progress!
                  </div>
                )}
                
                <button 
                  onClick={() => handleAddRow(selectedDay)}
                  className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium px-4 py-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Topic
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
