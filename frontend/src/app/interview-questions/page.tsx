"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HelpCircle, Plus, Search } from "lucide-react";

interface InterviewQuestion {
  id: number;
  interview_id?: number;
  question: string;
  answer?: string;
  difficulty?: string;
  category?: string;
}

export default function InterviewQuestionsPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    interview_id: "",
    question: "",
    category: "Technical",
    difficulty: "Medium",
    my_answer: ""
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
      fetchQuestions();
      fetchInterviews();
    }
  }, [session]);

  const fetchInterviews = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interviews`, { headers: getAuthHeaders() });
      if (res.ok) setInterviews(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interview-questions`, { headers: getAuthHeaders() });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.interview_id) return alert("Select an interview first");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/interview-questions`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: parseInt(formData.interview_id),
          question: formData.question,
          category: formData.category,
          difficulty: formData.difficulty,
          my_answer: formData.my_answer || null
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ interview_id: "", question: "", category: "Technical", difficulty: "Medium", my_answer: "" });
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(search.toLowerCase()) || 
    q.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Log Interview Question</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Related Interview</label>
                <select value={formData.interview_id} onChange={(e) => setFormData({...formData, interview_id: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" required>
                  <option value="">-- Select an Interview --</option>
                  {interviews.map(inv => <option key={inv.id} value={inv.id}>{inv.round_type} Round on {new Date(inv.date).toLocaleDateString()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Question</label>
                <textarea required rows={3} value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="e.g. How does garbage collection work in Python?" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                    <option value="Technical">Technical</option>
                    <option value="System Design">System Design</option>
                    <option value="DSA">DSA</option>
                    <option value="Behavioral">Behavioral</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">My Answer (Optional)</label>
                <textarea rows={2} value={formData.my_answer} onChange={(e) => setFormData({...formData, my_answer: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500" placeholder="Notes on how you answered..." />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors mt-2">
                Save Question
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Questions Vault</h1>
          <p className="text-slate-400 mt-1">Store and review questions you were asked in real interviews.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search questions or difficulty..." 
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
                <th className="px-6 py-4 w-1/2">Question</th>
                <th className="px-6 py-4">Answer/Notes</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No questions logged. Click "Add Question" to build your vault.</p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map(q => (
                  <tr key={q.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{q.question}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{q.answer || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${q.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {q.difficulty || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">Review</button>
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
