"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays, Plus, Search, CheckCircle, Clock, XCircle, Video } from "lucide-react";

interface Interview {
  id: number;
  job_id: number;
  round: number;
  date: string;
  type: string;
  feedback?: string;
  status: string;
}

export default function InterviewsPage() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    job_id: "",
    round_type: "Technical",
    date: "",
    time: "",
    interviewer: "",
    status: "Scheduled"
  });

  const getAuthHeaders = () => {
    return {
      "x-user-email": session?.user?.email || "",
      "x-user-name": session?.user?.name || "",
      "x-google-id": (session?.user as any)?.id || "",
    };
  };

  useEffect(() => {
    if (session) {
      fetchInterviews();
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs`, { headers: getAuthHeaders() });
      if (res.ok) setJobs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInterviews = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interviews`, { headers: getAuthHeaders() });
      if (res.ok) setInterviews(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_id) return alert("Select a job first");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interviews`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: parseInt(formData.job_id),
          round_type: formData.round_type,
          date: formData.date || null,
          time: formData.time || null,
          interviewer: formData.interviewer || null,
          status: formData.status
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ job_id: "", round_type: "Technical", date: "", time: "", interviewer: "", status: "Scheduled" });
        fetchInterviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInterviews = interviews.filter(i => 
    i.type.toLowerCase().includes(search.toLowerCase()) || 
    i.status.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase() === 'passed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status.toLowerCase() === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6 relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Schedule Interview</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Related Job</label>
                <select value={formData.job_id} onChange={(e) => setFormData({...formData, job_id: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" required>
                  <option value="">-- Select a Job --</option>
                  {jobs.map(job => <option key={job.id} value={job.id}>{job.title} at {job.company}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Round Type</label>
                <select value={formData.round_type} onChange={(e) => setFormData({...formData, round_type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="Managerial">Managerial</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Interviewer Name / Link</label>
                <input type="text" value={formData.interviewer} onChange={(e) => setFormData({...formData, interviewer: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. John Doe, or Meet Link" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                  <option value="Scheduled">Scheduled</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors mt-2">
                Save Interview
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-slate-400 mt-1">Track all your scheduled and completed interviews.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Schedule Interview
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by type or status..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Round</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Feedback</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No interviews found. Click "Schedule Interview" to add one.</p>
                  </td>
                </tr>
              ) : (
                filteredInterviews.map(i => (
                  <tr key={i.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                        <Video className="w-4 h-4 text-purple-400" />
                      </div>
                      {new Date(i.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">Round {i.round}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-semibold">
                        {i.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{i.feedback || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(i.status)}
                        <span className="capitalize">{i.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">Log Feedback</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
