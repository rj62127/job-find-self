"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Award, Plus, Search } from "lucide-react";

interface Offer {
  id: number;
  job_id: number;
  base_salary?: number;
  bonus?: number;
  equity?: string;
  deadline?: string;
  status: string;
}

export default function OffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    job_id: "",
    offered_ctc: "",
    fixed_ctc: "",
    variable_ctc: "",
    bonus: "",
    deadline: "",
    status: "Pending"
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
      fetchOffers();
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

  const fetchOffers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/offers`, { headers: getAuthHeaders() });
      if (res.ok) setOffers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_id) return alert("Select a job first");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/offers`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: parseInt(formData.job_id),
          offered_ctc: formData.offered_ctc,
          fixed_ctc: formData.fixed_ctc,
          variable_ctc: formData.variable_ctc,
          bonus: formData.bonus,
          deadline: formData.deadline || null,
          status: formData.status
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ job_id: "", offered_ctc: "", fixed_ctc: "", variable_ctc: "", bonus: "", deadline: "", status: "Pending" });
        fetchOffers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOffers = offers.filter(o => 
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Job Offer</h2>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Total CTC</label>
                  <input type="text" value={formData.offered_ctc} onChange={(e) => setFormData({...formData, offered_ctc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. 24,00,000" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fixed</label>
                  <input type="text" value={formData.fixed_ctc} onChange={(e) => setFormData({...formData, fixed_ctc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. 20,00,000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bonus / Equity</label>
                <input type="text" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. 2L Joining Bonus, 100 ESOPs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Deadline to Accept</label>
                <input type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors mt-2">
                Save Offer
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Offers</h1>
          <p className="text-slate-400 mt-1">Track, compare, and manage your job offers.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Offer
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search offers by status..." 
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
                <th className="px-6 py-4">Offer ID</th>
                <th className="px-6 py-4">Base Salary</th>
                <th className="px-6 py-4">Bonus</th>
                <th className="px-6 py-4">Equity</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No offers tracked yet. You'll get there soon!</p>
                  </td>
                </tr>
              ) : (
                filteredOffers.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-400" />
                      #{o.id}
                    </td>
                    <td className="px-6 py-4 font-mono text-green-400 font-bold">{o.base_salary ? `₹${o.base_salary.toLocaleString()}` : "-"}</td>
                    <td className="px-6 py-4 font-mono">{o.bonus ? `₹${o.bonus.toLocaleString()}` : "-"}</td>
                    <td className="px-6 py-4">{o.equity || "-"}</td>
                    <td className="px-6 py-4 text-slate-400">{o.deadline ? new Date(o.deadline).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${o.status.toLowerCase() === 'accepted' ? 'bg-green-500/20 text-green-400' : o.status.toLowerCase() === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">View Details</button>
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
