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
    }
  }, [session]);

  const fetchInterviews = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interviews`, { headers: getAuthHeaders() });
      if (res.ok) {
        setInterviews(await res.json());
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-slate-400 mt-1">Track all your scheduled and completed interviews.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
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
