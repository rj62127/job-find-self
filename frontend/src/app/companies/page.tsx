"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Building2, Plus, Search, ExternalLink } from "lucide-react";

interface Company {
  id: number;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  size?: string;
}

export default function CompaniesPage() {
  const { data: session } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
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
      fetchCompanies();
    }
  }, [session]);

  const fetchCompanies = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/companies`, { headers: getAuthHeaders() });
      if (res.ok) {
        setCompanies(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-slate-400 mt-1">Manage target organizations for your job search.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Company
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search companies..." 
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
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No companies found. Click "Add Company" to start tracking.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(company => (
                  <tr key={company.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      {company.name}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">{company.industry || "-"}</td>
                    <td className="px-6 py-4">{company.location || "-"}</td>
                    <td className="px-6 py-4">{company.size || "-"}</td>
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
