"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Search, ExternalLink, Mail, Phone } from "lucide-react";

interface Recruiter {
  id: number;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export default function RecruitersPage() {
  const { data: session } = useSession();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
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
      fetchRecruiters();
    }
  }, [session]);

  const fetchRecruiters = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/recruiters`, { headers: getAuthHeaders() });
      if (res.ok) {
        setRecruiters(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRecruiters = recruiters.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.email && r.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiters</h1>
          <p className="text-slate-400 mt-1">Manage your HR contacts and recruiters.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Recruiter
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search recruiters by name or email..." 
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRecruiters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No recruiters found. Click "Add Recruiter" to start tracking.</p>
                  </td>
                </tr>
              ) : (
                filteredRecruiters.map(recruiter => (
                  <tr key={recruiter.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {recruiter.name.charAt(0).toUpperCase()}
                      </div>
                      {recruiter.name}
                      {recruiter.linkedin_url && (
                        <a href={recruiter.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">{recruiter.designation || "-"}</td>
                    <td className="px-6 py-4 space-y-1">
                      {recruiter.email && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          <a href={`mailto:${recruiter.email}`} className="hover:text-blue-400">{recruiter.email}</a>
                        </div>
                      )}
                      {recruiter.phone && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{recruiter.phone}</span>
                        </div>
                      )}
                      {!recruiter.email && !recruiter.phone && "-"}
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
