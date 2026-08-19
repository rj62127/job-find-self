"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Plus, Search, Calendar, User } from "lucide-react";

interface Communication {
  id: number;
  job_id: number;
  recruiter_id?: number;
  date: string;
  type: string;
  notes?: string;
  next_step?: string;
}

export default function CommunicationsPage() {
  const { data: session } = useSession();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    job_id: "",
    type: "Phone Call",
    notes: "",
    next_step: ""
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
      fetchCommunications();
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

  const fetchCommunications = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/communications`, { headers: getAuthHeaders() });
      if (res.ok) {
        setCommunications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_id) {
      alert("Please select a job first.");
      return;
    }
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/communications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: parseInt(formData.job_id),
          date: new Date().toISOString(),
          type: formData.type,
          notes: formData.notes,
          next_step: formData.next_step
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ job_id: "", type: "Phone Call", notes: "", next_step: "" });
        fetchCommunications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCommunications = communications.filter(c => 
    (c.notes && c.notes.toLowerCase().includes(search.toLowerCase())) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Log HR Call / Email</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Related Job</label>
                <select 
                  value={formData.job_id} 
                  onChange={(e) => setFormData({...formData, job_id: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Select a Job --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title} at {job.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Interaction Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Email">Email</option>
                  <option value="LinkedIn DM">LinkedIn DM</option>
                  <option value="In-person">In-person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes / Summary</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="What did you discuss? e.g. HR reached out for a prescreen..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Next Step</label>
                <input 
                  type="text" 
                  value={formData.next_step} 
                  onChange={(e) => setFormData({...formData, next_step: e.target.value})}
                  placeholder="e.g. Schedule technical round next week"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors mt-2">
                Save Interaction
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Communications & Follow-ups</h1>
          <p className="text-slate-400 mt-1">Track all your emails, LinkedIn messages, and recruiter calls.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Log Communication
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search notes or types..." 
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
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Next Step</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCommunications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No communications logged. Click "Log Communication" to track.</p>
                  </td>
                </tr>
              ) : (
                filteredCommunications.map(comm => (
                  <tr key={comm.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(comm.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-semibold">
                        {comm.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{comm.notes || "-"}</td>
                    <td className="px-6 py-4">{comm.next_step || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">Edit</button>
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
