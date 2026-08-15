"use client";

import ReactMarkdown from 'react-markdown';
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
  const [groqKey, setGroqKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  
  const [uploadsRemaining, setUploadsRemaining] = useState(1);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "kanban">("feed");
  
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedHike, setExpectedHike] = useState("");
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionPage, setQuestionPage] = useState(0);

  // Chat state
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);

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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
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
        setGroqKey(data.groq_key || "");
        setUploadsRemaining(data.uploads_remaining !== undefined ? data.uploads_remaining : 1);
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
        body: JSON.stringify({ gemini_key: geminiKey, serper_key: serperKey, groq_key: groqKey })
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

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedJob) return;
    
    const newHistory = [...chatHistory, {role: 'user', content: chatMessage}];
    setChatHistory(newHistory);
    setChatMessage("");
    setIsChatting(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs/${selectedJob.id}/chat`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, history: chatHistory.slice(1) })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatHistory([...newHistory, {role: 'assistant', content: data.response}]);
      } else {
        const err = await res.json();
        alert(err.detail);
        setChatHistory(newHistory.slice(0, -1));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send message.");
      setChatHistory(newHistory.slice(0, -1));
    }
    setIsChatting(false);
  };

  const handlePayment = async (planId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const orderRes = await fetch(`${API_URL}/create-razorpay-order`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });
      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_xxxxxx",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "JobSense AI",
        description: `Premium Plan: ${planId}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API_URL}/verify-payment`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: planId
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setUploadsRemaining(verifyData.uploads_remaining);
            setIsPricingOpen(false);
            setMessage(`Payment Successful! You have ${verifyData.uploads_remaining} uploads remaining.`);
            setTimeout(() => setMessage(""), 5000);
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || ""
        },
        theme: {
          color: "#2563eb"
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Error initiating payment");
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    
    if (!geminiKey && !serperKey && uploadsRemaining <= 0) {
      setMessage("⚠️ Free trial exhausted! Upgrade to Premium or set your API keys.");
      setIsPricingOpen(true);
      return;
    }

    setIsUploading(true);
    setUploadStep(1);
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const timers = [
      setTimeout(() => setUploadStep(2), 2000),
      setTimeout(() => setUploadStep(3), 6000),
      setTimeout(() => setUploadStep(4), 10000),
      setTimeout(() => setUploadStep(5), 13000),
    ];

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
        if (!geminiKey && !serperKey) setUploadsRemaining(prev => Math.max(0, prev - 1));
        setTimeout(() => {
          fetchJobs();
          setIsUploading(false);
          setUploadStep(0);
          setFile(null);
          setMessage("Jobs successfully fetched! ✨");
          setTimeout(() => setMessage(""), 5000);
        }, 15000);
      } else {
        timers.forEach(t => clearTimeout(t));
        setIsUploading(false);
        setUploadStep(0);
        const err = await res.json();
        setMessage(`Error: ${err.detail}`);
      }
    } catch (e) {
      timers.forEach(t => clearTimeout(t));
      setIsUploading(false);
      setUploadStep(0);
      setMessage("Failed to connect to the server.");
    }
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
            <div key={job.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => { setSelectedJob(job); setQuestionPage(0); setChatHistory([{role: 'assistant', content: 'Hi! I am your AI Interview Coach. Ask me anything about this role, or type "Start Mock Interview" to begin!'}]); }}>
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
          
          <div className="flex gap-4 items-center">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-slate-300 font-semibold text-sm">💎 {uploadsRemaining} Uploads</span>
            </div>
            <button onClick={() => setIsPricingOpen(true)} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-xl text-white font-bold shadow-lg transition-all">
              Upgrade
            </button>
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
            <div className="grid md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Gemini API Key</label>
                <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Serper API Key</label>
                <input type="password" value={serperKey} onChange={(e) => setSerperKey(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Groq API Key</label>
                <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
            </div>
            <button onClick={saveKeys} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold">Save Keys</button>
            
            <div className="mt-6 pt-6 border-t border-slate-800">
              <button onClick={() => setShowApiHelp(!showApiHelp)} className="text-blue-400 text-sm font-semibold mb-2 flex items-center gap-2">
                {showApiHelp ? "▼ Hide API Instructions" : "▶ How to get free API Keys? 💡"}
              </button>
              {showApiHelp && (
                <div className="text-sm text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="font-bold text-white mb-2">Gemini API Key (Google AI Studio)</h4>
                  <ol className="list-decimal ml-4 mb-4 space-y-1">
                    <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">aistudio.google.com</a></li>
                    <li>Sign in and click "Create API key"</li>
                    <li>Copy and paste the key above.</li>
                  </ol>
                  <h4 className="font-bold text-white mb-2">Serper API Key (Google Search)</h4>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Go to <a href="https://serper.dev" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">serper.dev</a></li>
                    <li>Sign up for a free account (gives you 2,500 free searches).</li>
                    <li>Go to "API Key" dashboard, copy and paste it above.</li>
                  <h4 className="font-bold text-white mb-2 mt-4">Groq API Key (AI Chat)</h4>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">console.groq.com</a></li>
                    <li>Sign up and click "Create API Key". It's free and blazingly fast.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {isPricingOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl w-full relative animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-white">Upgrade to Premium 💎</h2>
                <button onClick={() => setIsPricingOpen(false)} className="text-slate-400 hover:text-white text-2xl font-bold">✕</button>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-blue-500 transition-all flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-3xl font-extrabold text-white mb-4">₹99</div>
                  <ul className="text-slate-400 space-y-3 mb-8 flex-1 text-sm">
                    <li className="flex items-center gap-2"><span>✅</span> 3 Resume Uploads</li>
                    <li className="flex items-center gap-2"><span>✅</span> AI Job Matching</li>
                    <li className="flex items-center gap-2"><span>✅</span> Custom Cover Letters</li>
                  </ul>
                  <button onClick={() => handlePayment('starter')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">Buy Now</button>
                </div>
                <div className="bg-gradient-to-b from-blue-900/50 to-slate-800 rounded-2xl p-6 border border-blue-500 shadow-xl shadow-blue-900/20 flex flex-col relative transform md:-translate-y-4">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap">MOST POPULAR</div>
                  <h3 className="text-xl font-bold text-white mb-2 mt-2">Pro</h3>
                  <div className="text-4xl font-extrabold text-white mb-4">₹199</div>
                  <ul className="text-blue-200 space-y-3 mb-8 flex-1 text-sm font-medium">
                    <li className="flex items-center gap-2"><span>🔥</span> 10 Resume Uploads</li>
                    <li className="flex items-center gap-2"><span>✅</span> AI Job Matching</li>
                    <li className="flex items-center gap-2"><span>✅</span> Custom Cover Letters</li>
                    <li className="flex items-center gap-2"><span>✅</span> Priority Support</li>
                  </ul>
                  <button onClick={() => handlePayment('pro')} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30">Buy Now</button>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-amber-500 transition-all flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">Elite</h3>
                  <div className="text-3xl font-extrabold text-white mb-4">₹499</div>
                  <ul className="text-slate-400 space-y-3 mb-8 flex-1 text-sm">
                    <li className="flex items-center gap-2"><span>🚀</span> 50 Resume Uploads</li>
                    <li className="flex items-center gap-2"><span>✅</span> AI Job Matching</li>
                    <li className="flex items-center gap-2"><span>✅</span> Custom Cover Letters</li>
                  </ul>
                  <button onClick={() => handlePayment('elite')} className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-xl">Buy Now</button>
                </div>
              </div>
              <div className="text-center mt-8 text-slate-500 text-sm">
                Secure payments powered by <b>Razorpay</b>.
              </div>
            </div>
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
              {!geminiKey && !serperKey && uploadsRemaining <= 0 ? (
                <button onClick={() => setIsPricingOpen(true)} className="px-6 py-3 font-bold text-white transition-all rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-lg">
                  🔒 Out of Uploads - Upgrade
                </button>
              ) : (
                <label className={`cursor-pointer px-6 py-3 font-bold text-white transition-all rounded-xl ${isUploading ? 'bg-slate-600 pointer-events-none' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30'}`}>
                  <span>{isUploading ? "Processing..." : "Upload Resume"}</span>
                  <input type="file" className="hidden" accept=".pdf,.txt" disabled={isUploading} onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleUpload(selected);
                    e.target.value = '';
                  }}/>
                </label>
              )}
              {file && !isUploading && <span className="text-green-400 text-sm font-medium">Loaded: {file.name}</span>}
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
            <button onClick={() => setActiveTab("feed")} className={`px-6 py-2 rounded-lg font-semibold text-sm ${activeTab === 'feed' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>AI Job Feed</button>
            <button onClick={() => setActiveTab("kanban")} className={`px-6 py-2 rounded-lg font-semibold text-sm ${activeTab === 'kanban' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>Kanban Board</button>
          </div>
        </section>

        {isUploading && (
          <div className="mb-8 glass-panel p-6 rounded-3xl animate-in fade-in zoom-in-95 border-blue-500/30 shadow-lg shadow-blue-900/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="animate-spin text-2xl">⏳</span> AI is doing its magic...
            </h3>
            <div className="relative pt-1">
              <div className="flex mb-4 items-center justify-between text-xs font-semibold">
                <span className={`px-2 py-1 rounded-full ${uploadStep >= 1 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>1. Uploading</span>
                <span className={`px-2 py-1 rounded-full ${uploadStep >= 2 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>2. Extracting Resume</span>
                <span className={`px-2 py-1 rounded-full ${uploadStep >= 3 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>3. AI Analysis</span>
                <span className={`px-2 py-1 rounded-full ${uploadStep >= 4 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>4. Web Search</span>
                <span className={`px-2 py-1 rounded-full ${uploadStep >= 5 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>5. Scoring Matches</span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800">
                <div style={{ width: `${uploadStep * 20}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000 ease-out"></div>
              </div>
              <p className="text-slate-400 text-sm text-center animate-pulse mt-4">
                {uploadStep === 1 && "Securely uploading your document..."}
                {uploadStep === 2 && "Reading your experience and skills..."}
                {uploadStep === 3 && "Determining the perfect role for you..."}
                {uploadStep === 4 && "Scouring job portals (LinkedIn, Naukri) for live openings..."}
                {uploadStep === 5 && "Calculating personalized match scores... Almost done!"}
              </p>
            </div>
          </div>
        )}

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
              <div className="bg-slate-900/50 rounded-xl p-6 text-slate-300 text-sm border border-slate-700/50 mb-8 max-h-96 overflow-y-auto kanban-scroll">
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-6 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
                  }}
                >
                  {selectedJob.cover_letter}
                </ReactMarkdown>
              </div>

              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> Why should we hire you?
              </h4>
              <div className="bg-slate-900/50 rounded-xl p-6 text-slate-300 text-sm border border-slate-700/50 mb-8 max-h-96 overflow-y-auto kanban-scroll">
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-6 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
                  }}
                >
                  {selectedJob.application_answers}
                </ReactMarkdown>
              </div>

              {selectedJob.technical_questions && (
                <>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Technical Questions
                  </h4>
                  <div className="bg-slate-900/50 rounded-xl p-6 text-slate-300 text-sm border border-slate-700/50 mb-8 max-h-[600px] overflow-y-auto kanban-scroll flex flex-col">
                    <div className="flex-1">
                      <ReactMarkdown
                        components={{
                          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-8 mb-3 border-b border-slate-700 pb-2" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 text-slate-300 space-y-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-blue-300" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                      >
                        {(() => {
                          const sections = selectedJob.technical_questions.split(/(?=### )/).filter(s => s.trim().length > 0);
                          const itemsPerPage = 5;
                          const startIndex = questionPage * itemsPerPage;
                          return sections.slice(startIndex, startIndex + itemsPerPage).join('\n');
                        })()}
                      </ReactMarkdown>
                    </div>

                    {(() => {
                      const sections = selectedJob.technical_questions.split(/(?=### )/).filter(s => s.trim().length > 0);
                      const itemsPerPage = 5;
                      const totalPages = Math.ceil(sections.length / itemsPerPage);
                      
                      if (totalPages <= 1) return null;
                      
                      return (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                          <button 
                            onClick={() => setQuestionPage(p => Math.max(0, p - 1))}
                            disabled={questionPage === 0}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${questionPage === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                          >
                            ← Previous
                          </button>
                          <span className="text-slate-400 text-sm font-semibold">
                            Page {questionPage + 1} of {totalPages}
                          </span>
                          <button 
                            onClick={() => setQuestionPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={questionPage === totalPages - 1}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${questionPage === totalPages - 1 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                          >
                            Next →
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
              
              <div className="mt-8 text-center pt-6 border-t border-slate-800">
                <button 
                  onClick={() => generateAssets(selectedJob.id)}
                  disabled={isGenerating}
                  className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all ${isGenerating ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-lg'}`}
                >
                  {isGenerating ? "Regenerating..." : "🔄 Regenerate All AI Assets"}
                </button>
              </div>

              {/* Groq Chat UI */}
              <div className="mt-8 pt-8 border-t border-slate-800">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🤖</span> AI Interview Coach (Groq)
                </h4>
                
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col h-96">
                  <div className="flex-1 p-4 overflow-y-auto kanban-scroll flex flex-col gap-4">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'}`}>
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none p-4 flex gap-1">
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-800/80 border-t border-slate-700/50 flex gap-2">
                    <input 
                      type="text" 
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Ask about the interview..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={sendChatMessage}
                      disabled={isChatting || !chatMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
