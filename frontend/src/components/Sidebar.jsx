import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  ClipboardList,
  BarChart3,
  FileText,
  Settings,
  User,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, closeSidebar }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const studentLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/history', label: 'Attendance History', icon: ClipboardList },
    { to: '/profile', label: 'My Profile', icon: User }
  ];

  const teacherLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/mark-attendance', label: 'Mark Attendance', icon: CheckSquare },
    { to: '/records', label: 'Attendance Records', icon: ClipboardList },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const links = isStudent ? studentLinks : teacherLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#111216] border-r border-[#262933] transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-200 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#262933] md:hidden">
          <span className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">
            Navigation Menu
          </span>
          <button
            onClick={closeSidebar}
            className="p-1 rounded-lg text-slate-400 hover:bg-[#191B21]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF7A30] to-[#FF7A30]/80 text-white shadow-glow-orange'
                      : 'text-slate-400 hover:bg-[#191B21] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#262933] bg-[#191B21]/50">
          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Session Info</div>
          <div className="text-xs font-bold text-white truncate mt-0.5">
            {user?.name || 'User'}
          </div>
          <div className="text-[11px] text-[#FF7A30] font-semibold truncate">
            {user?.role === 'STUDENT' ? `ID: ${user?.studentDetails?.student_id || 'ST001'}` : user?.email}
          </div>
        </div>
      </aside>
    </>
  );
}
