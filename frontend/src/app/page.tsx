"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Briefcase, Building2, CalendarDays, Award, ArrowRight, PlusCircle, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    companies: 0,
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
      // Fetch stats from existing `/jobs` endpoint just for basic counts
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/jobs`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats({
          applications: data.length,
          interviews: data.filter((j: any) => j.status === 'Interview').length,
          offers: data.filter((j: any) => j.status === 'Offer').length,
          companies: new Set(data.map((j: any) => j.company)).size,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-lg">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">JobTrack CRM</h1>
        <p className="text-slate-400 mb-8 max-w-md text-center">Your personal operating system for tracking job applications, interviews, and offers.</p>
        <Link 
          href="/api/auth/signin" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in to get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {session.user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-400 mt-1">Here's your job search overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 font-medium">Total Applications</h3>
            <Briefcase className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{stats.applications}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 font-medium">Active Interviews</h3>
            <CalendarDays className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{stats.interviews}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 font-medium">Companies Reached</h3>
            <Building2 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{stats.companies}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 font-medium">Offers Received</h3>
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{stats.offers}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/applications" className="flex items-center gap-3 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600/20 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">Add Job Application</h4>
              <p className="text-xs text-slate-400 mt-0.5">Parse resume or track manually</p>
            </div>
          </Link>
          <Link href="/interviews" className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">Schedule Interview</h4>
              <p className="text-xs text-slate-400 mt-0.5">Track upcoming rounds</p>
            </div>
          </Link>
          <Link href="/companies" className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">Manage Companies</h4>
              <p className="text-xs text-slate-400 mt-0.5">Add target organizations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
