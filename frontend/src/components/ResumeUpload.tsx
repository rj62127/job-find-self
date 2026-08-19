"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ResumeUploadProps {
  onUploadSuccess?: () => void;
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [message, setMessage] = useState("");
  
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedHike, setExpectedHike] = useState("");
  const [uploadsRemaining, setUploadsRemaining] = useState(1);
  const [hasKeys, setHasKeys] = useState(false);

  const getAuthHeaders = () => {
    return {
      "x-user-email": session?.user?.email || "",
      "x-user-name": session?.user?.name || "",
      "x-google-id": (session?.user as any)?.id || "",
    };
  };

  useEffect(() => {
    if (session) {
      fetchApiKeys();
    }
  }, [session]);

  const fetchApiKeys = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api-keys`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHasKeys(!!(data.gemini_key || data.serper_key));
        setUploadsRemaining(data.uploads_remaining !== undefined ? data.uploads_remaining : 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    
    if (!hasKeys && uploadsRemaining <= 0) {
      setMessage("⚠️ Free trial exhausted! Upgrade to Premium or set your API keys.");
      // Ideally trigger pricing modal here, but for now just show message
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
        if (!hasKeys) setUploadsRemaining(prev => Math.max(0, prev - 1));
        setTimeout(() => {
          setIsUploading(false);
          setUploadStep(0);
          setFile(null);
          setMessage("Jobs successfully fetched! ✨ Check your applications.");
          setTimeout(() => setMessage(""), 5000);
          if (onUploadSuccess) onUploadSuccess();
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

  return (
    <div className="w-full">
      {message && (
        <div className="mb-6 px-6 py-3 bg-blue-900/50 border border-blue-500/30 text-blue-200 rounded-xl font-medium">
          {message}
        </div>
      )}

      <section className="mb-8 glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 bg-slate-900/80">
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-xs text-slate-400 mb-1 ml-1">Current CTC (LPA)</label>
              <input type="number" placeholder="e.g. 10" value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} className="w-full sm:w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 ml-1">Expected Hike (%)</label>
              <input type="number" placeholder="e.g. 30" value={expectedHike} onChange={(e) => setExpectedHike(e.target.value)} className="w-full sm:w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
            {!hasKeys && uploadsRemaining <= 0 ? (
              <button className="px-6 py-3 font-bold text-white transition-all rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-lg">
                🔒 Out of Uploads - Upgrade Required
              </button>
            ) : (
              <label className={`cursor-pointer px-6 py-3 font-bold text-white transition-all rounded-xl text-center ${isUploading ? 'bg-slate-600 pointer-events-none' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30'}`}>
                <span>{isUploading ? "Processing..." : "Upload Resume"}</span>
                <input type="file" className="hidden" accept=".pdf,.txt" disabled={isUploading} onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleUpload(selected);
                  e.target.value = '';
                }}/>
              </label>
            )}
            {file && !isUploading && <span className="text-green-400 text-sm font-medium break-all">Loaded: {file.name}</span>}
          </div>
        </div>
        
        <div className="flex flex-col text-right hidden lg:block">
          <p className="text-sm text-slate-400 font-medium">AI Agent Status</p>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-white font-bold tracking-wide">Ready for Job Hunting</span>
          </div>
        </div>
      </section>

      {isUploading && (
        <div className="mb-8 glass-panel p-6 rounded-3xl animate-in fade-in zoom-in-95 border border-blue-500/30 shadow-lg shadow-blue-900/20 bg-slate-900/90">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="animate-spin text-2xl">⏳</span> AI is doing its magic...
          </h3>
          <div className="relative pt-1">
            <div className="flex mb-4 items-center justify-between text-xs font-semibold overflow-x-auto gap-2">
              <span className={`px-2 py-1 rounded-full whitespace-nowrap ${uploadStep >= 1 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>1. Uploading</span>
              <span className={`px-2 py-1 rounded-full whitespace-nowrap ${uploadStep >= 2 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>2. Extracting Resume</span>
              <span className={`px-2 py-1 rounded-full whitespace-nowrap ${uploadStep >= 3 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>3. AI Analysis</span>
              <span className={`px-2 py-1 rounded-full whitespace-nowrap ${uploadStep >= 4 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>4. Web Search</span>
              <span className={`px-2 py-1 rounded-full whitespace-nowrap ${uploadStep >= 5 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500'}`}>5. Scoring</span>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800">
              <div style={{ width: `${uploadStep * 20}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000 ease-out"></div>
            </div>
            <p className="text-slate-400 text-sm text-center animate-pulse mt-4">
              {uploadStep === 1 && "Securely uploading your document..."}
              {uploadStep === 2 && "Reading your experience and skills..."}
              {uploadStep === 3 && "Determining the perfect role for you..."}
              {uploadStep === 4 && "Scouring job portals for live openings..."}
              {uploadStep === 5 && "Calculating personalized match scores... Almost done!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
