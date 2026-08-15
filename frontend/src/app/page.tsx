"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  match_score: number;
  portal: string;
  status: string;
  url?: string;
  cover_letter?: string;
  application_answers?: string;
  technical_questions?: string;
}

export default function Home() {
  const { data: session, status } = useSession();

  const [file, setFile] = useState<File | null>(null);
  
  const [geminiKey, setGeminiKey] = useState("");
  const [serperKey, setSerperKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "kanban">("feed");
  
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedHike, setExpectedHike] = useState("");
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    return {
      "x-user-email": session?.user?.email || "",
      "x-user-name": session?.user?.name || "",
      "x-google-id": (session?.user as any)?.id || "",
    };
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchApiKeys();
      fetchJobs();
    }
  }, [status]);

  const fetchApiKeys = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api-keys`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiKey(data.gemini_key || "");
        setSerperKey(data.serper_key || "");
      }
    } catch (e) {
      console.error("Failed to fetch API keys.", e);
    }
  };

  const saveKeys = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api-keys`, {
        method: "POST",
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_key: geminiKey, serper_key: serperKey })
      });
      if (res.ok) {
        setIsSettingsOpen(false);
        setMessage("API Keys saved securely to database!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) {
      console.error("Failed to save keys", e);
    }
  };

  const fetchJobs = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Failed to fetch jobs.", e);
    }
  };

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const generateAssets = async (jobId: number) => {
    setIsGenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs/${jobId}/generate-assets`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(jobs.map(j => j.id === jobId ? { ...j, cover_letter: data.cover_letter, application_answers: data.answers, technical_questions: data.technical_questions } : j));
        setSelectedJob({ ...jobs.find(j => j.id === jobId)!, cover_letter: data.cover_letter, application_answers: data.answers, technical_questions: data.technical_questions });
      } else {
        const err = await res.json();
        alert(err.detail);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate assets.");
    }
    setIsGenerating(false);
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    if (!geminiKey || !serperKey) {
      setMessage("⚠️ Please set your API keys in settings first.");
      setIsSettingsOpen(true);
      return;
    }

    setIsUploading(true);
    setMessage("Uploading resume and starting AI matching...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/upload-resume`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "x-current-ctc": currentCtc,
          "x-expected-hike": expectedHike
        },
        body: formData,
      });

      if (res.ok) {
        setMessage("Resume uploaded! AI is analyzing. Jobs will appear shortly.");
        setTimeout(fetchJobs, 15000);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.detail}`);
      }
    } catch (e) {}
    
    setIsUploading(false);
  };

  const renderKanbanColumn = (title: string, statusKey: string, bgColor: string) => {
    const columnJobs = jobs.filter(j => j.status === statusKey);
    return (
      <div className="flex-1 min-w-[280px] bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
        <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${bgColor} text-white px-4 py-2 rounded-xl`}>
          {title} <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{columnJobs.length}</span>
        </h3>
        <div className="flex flex-col gap-4">
          {columnJobs.map(job => (
            <div key={job.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => setSelectedJob(job)}>
              <h4 className="font-semibold text-white text-sm mb-1">{job.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{job.company}</p>
              
              <div onClick={e => e.stopPropagation()}>
                <select 
                  className="w-full bg-slate-900 text-xs text-slate-300 border border-slate-700 rounded p-1"
                  value={job.status}
                  onChange={(e) => updateJobStatus(job.id, e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>
            </div>
          ))}
          {columnJobs.length === 0 && <div className="text-center text-xs text-slate-500 py-4">No jobs</div>}
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400 mb-8">Sign in to track your personalized job matches and manage your applications.</p>
          <button 
            onClick={() => signIn('google')} 
            className="w-full px-4 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      
      <div className="flex-1 w-full relative z-10">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
              <span className="gradient-text">JobSense AI</span> Tracker
            </h1>
            <p className="text-lg text-slate-400">Welcome, {session?.user?.name}</p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => signOut()} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-semibold transition-all">
              Sign Out
            </button>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-semibold transition-all">
              API Settings
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-6 px-6 py-3 bg-blue-900/50 border border-blue-500/30 text-blue-200 rounded-xl font-medium">
            {message}
          </div>
        )}

        {isSettingsOpen && (
          <div className="mb-8 glass-panel p-6 rounded-2xl border-blue-500/30 animate-in slide-in-from-top-4">
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Gemini API Key</label>
                <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Serper API Key</label>
                <input type="password" value={serperKey} onChange={(e) => setSerperKey(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
            </div>
            <button onClick={saveKeys} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold">Save Keys</button>
          </div>
        )}

        <section className="mb-8 glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-xs text-slate-400 mb-1 ml-1">Current CTC (LPA)</label>
                <input type="number" placeholder="e.g. 10" value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} className="w-32 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 ml-1">Expected Hike (%)</label>
                <input type="number" placeholder="e.g. 30" value={expectedHike} onChange={(e) => setExpectedHike(e.target.value)} className="w-32 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className={`cursor-pointer px-6 py-3 font-bold text-white transition-all rounded-xl ${isUploading ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
                <span>{isUploading ? "Uploading..." : "Upload Resume"}</span>
                <input type="file" className="hidden" accept=".pdf,.txt" disabled={isUploading} onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleUpload(selected);
                  e.target.value = '';
                }}/>
              </label>
              {file && <span className="text-green-400 text-sm font-medium">Loaded: {file.name}</span>}
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
            <button onClick={() => setActiveTab("feed")} className={`px-6 py-2 rounded-lg font-semibold text-sm ${activeTab === 'feed' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>AI Job Feed</button>
            <button onClick={() => setActiveTab("kanban")} className={`px-6 py-2 rounded-lg font-semibold text-sm ${activeTab === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Kanban Board</button>
          </div>
        </section>

        <section>
          {activeTab === 'feed' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.filter(j => j.status === 'New').map((job) => (
                <div key={job.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full border border-transparent hover:border-blue-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{job.portal}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${job.match_score > 80 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {job.match_score}% Match
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{job.title}</h3>
                  <p className="text-slate-400 text-sm mb-6">{job.company} • {job.location}</p>
                  
                  <div className="flex flex-col mt-auto pt-4 border-t border-white/5 gap-2">
                    <a href={job.url} target="_blank" rel="noreferrer" className="block w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-sm font-semibold border border-purple-500/20 text-center">
                      View & Apply on Site
                    </a>
                    <button onClick={() => updateJobStatus(job.id, 'Applied')} className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm font-semibold border border-blue-500/20">
                      Move to Kanban (Applied)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 kanban-scroll">
              {renderKanbanColumn("Applied", "Applied", "bg-blue-600")}
              {renderKanbanColumn("Interview", "Interview", "bg-purple-600")}
              {renderKanbanColumn("Offer", "Offer", "bg-green-600")}
              {renderKanbanColumn("Rejected", "Rejected", "bg-red-600")}
            </div>
          )}
        </section>
      </div>

      {/* AI Cover Letter Modal / Right Sidebar */}
      {selectedJob && (
        <div className="fixed inset-y-0 right-0 w-full md:w-1/3 bg-slate-900 border-l border-slate-800 p-8 overflow-y-auto z-50 shadow-2xl animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Application Helper</h2>
            <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white">✕ Close</button>
          </div>
          
          <div className="mb-6 pb-6 border-b border-slate-800">
            <h3 className="text-xl font-semibold text-white mb-2">{selectedJob.title}</h3>
            <p className="text-slate-400 mb-4">{selectedJob.company}</p>
            {selectedJob.url && (
              <a href={selectedJob.url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold">
                Apply on Company Site ↗
              </a>
            )}
          </div>

          {!selectedJob.cover_letter ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <span className="text-2xl">✨</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Generate Smart Application</h4>
              <p className="text-slate-400 text-sm mb-6">Use your resume to instantly generate a tailored cover letter and interview answers for this job.</p>
              
              <button 
                onClick={() => generateAssets(selectedJob.id)}
                disabled={isGenerating}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all w-full ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02]'}`}
              >
                {isGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          ) : (
            <div>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">📄</span> Custom Cover Letter
              </h4>
              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 text-sm whitespace-pre-wrap font-mono mb-8 border border-slate-800">
                {selectedJob.cover_letter}
              </div>

              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> Why should we hire you?
              </h4>
              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 text-sm whitespace-pre-wrap font-mono border border-slate-800 mb-8">
                {selectedJob.application_answers}
              </div>

              {selectedJob.technical_questions && (
                <>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Technical Questions
                  </h4>
                  <div className="bg-slate-950 rounded-xl p-4 text-slate-300 text-sm whitespace-pre-wrap font-mono border border-slate-800 mb-8">
                    {selectedJob.technical_questions}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
