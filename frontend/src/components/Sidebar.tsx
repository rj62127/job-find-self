"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Building2, 
  Users, 
  MessageSquareText, 
  FileCheck2, 
  CalendarDays, 
  HelpCircle, 
  CheckSquare,
  Award,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Recruiters', href: '/recruiters', icon: Users },
  { name: 'Communications', href: '/communications', icon: MessageSquareText },
  { name: 'Follow-ups', href: '/follow-ups', icon: CalendarDays },
  { name: 'Assessments', href: '/assessments', icon: FileCheck2 },
  { name: 'Interviews', href: '/interviews', icon: CalendarDays },
  { name: 'Questions Vault', href: '/interview-questions', icon: HelpCircle },
  { name: 'Prep Tracker', href: '/prep-tracker', icon: CheckSquare },
  { name: 'Offers', href: '/offers', icon: Award },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            J
          </div>
          <span className="font-bold text-xl tracking-tight text-white">JobTrack<span className="text-blue-500">CRM</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1 kanban-scroll">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'hover:bg-slate-800 hover:text-white border border-transparent'}`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === '/settings' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'hover:bg-slate-800 hover:text-white border border-transparent'}`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
