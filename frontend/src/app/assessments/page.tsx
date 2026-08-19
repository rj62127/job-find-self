"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Code2, Plus, Search, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";

interface Assessment {
  id: number;
  job_id: number;
  name: string;
  url?: string;
  deadline?: string;
  status: string;
  score?: number;
}

export default function AssessmentsPage() {
  const { data: session } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    job_id: "",
    platform: "",
    name: "",
    url: "",
    deadline: "",
    status: "Pending",
    score: ""
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
      fetchAssessments();
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

  const fetchAssessments = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/assessments`, { headers: getAuthHeaders() });
      if (res.ok) setAssessments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_id) return alert("Select a job first");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/assessments`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: parseInt(formData.job_id),
          platform: formData.platform,
          name: formData.name,
          url: formData.url || null,
          deadline: formData.deadline || null,
          status: formData.status,
          score: formData.score ? parseFloat(formData.score) : null
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ job_id: "", platform: "", name: "", url: "", deadline: "", status: "Pending", score: "" });
        fetchAssessments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAssessments = assessments.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.status.toLowerCase().includes(search.toLowerCase())
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
              <h2 className="text-xl font-bold text-white">Add Assessment</h2>
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
                  <input type="text" value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. HackerRank" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name / Topic</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. Backend OA" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Test Link</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
                <input type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                    <option value="Pending">Pending</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Score</label>
                  <input type="number" value={formData.score} onChange={(e) => setFormData({...formData, score: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="%" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors mt-2">
                Save Assessment
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Online Assessments</h1>
          <p className="text-slate-400 mt-1">Manage coding tests and technical assignments.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Assessment
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assessments..." 
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
                <th className="px-6 py-4">Assessment Name</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Code2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No assessments found. Click "Add Assessment" to track one.</p>
                  </td>
                </tr>
              ) : (
                filteredAssessments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-blue-400" />
                      </div>
                      {a.name}
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {a.deadline ? new Date(a.deadline).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(a.status)}
                        <span className="capitalize">{a.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{a.score ? `${a.score}%` : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">Update</button>
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
