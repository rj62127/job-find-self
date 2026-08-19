"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Bell } from "lucide-react";

export default function Topbar() {
  const { data: session } = useSession();

  return (
    <div className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950"></span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">{session?.user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <User className="w-5 h-5 text-slate-300" />
          </div>
          <button 
            onClick={() => signOut()} 
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
