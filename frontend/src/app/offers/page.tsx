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
    }
  }, [session]);

  const fetchOffers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/offers`, { headers: getAuthHeaders() });
      if (res.ok) {
        setOffers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOffers = offers.filter(o => 
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Offers</h1>
          <p className="text-slate-400 mt-1">Track, compare, and manage your job offers.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
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
