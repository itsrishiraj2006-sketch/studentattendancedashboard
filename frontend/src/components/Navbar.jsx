import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, Menu, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111216]/90 backdrop-blur-md border-b border-[#262933]">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-[#191B21] transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-[#FF7A30] to-[#9B6CFF] text-white rounded-xl shadow-glow-orange group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Student Attendance Dashboard
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FF7A30]/20 text-[#FF7A30] border border-[#FF7A30]/40">
                  D3.js Powered
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Interactive Attendance Analytics Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Right Controls & Profile */}
        {user && (
          <div className="flex items-center gap-3 md:gap-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
              user.role === 'STUDENT'
                ? 'bg-[#35C9FF]/15 text-[#35C9FF] border-[#35C9FF]/30'
                : 'bg-[#9B6CFF]/15 text-[#9B6CFF] border-[#9B6CFF]/30'
            }`}>
              {user.role}
            </span>

            {/* Profile Info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#262933]">
              <div className="w-8 h-8 rounded-xl bg-[#FF7A30]/20 text-[#FF7A30] border border-[#FF7A30]/40 flex items-center justify-center font-black text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {user.studentDetails?.student_id || user.email}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191B21] text-slate-300 border border-[#262933] hover:bg-[#FF5577]/20 hover:text-[#FF5577] hover:border-[#FF5577]/40 font-semibold text-xs transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
