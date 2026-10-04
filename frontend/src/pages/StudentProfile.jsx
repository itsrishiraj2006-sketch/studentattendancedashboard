import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { User, Mail, GraduationCap, Calendar, Shield } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const studentId = user?.studentDetails?.id || user?.id;
        const res = await api.get(`/analytics/student/${studentId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadProfile();
  }, [user]);

  const student = data?.student || user?.studentDetails || {};
  const stats = data?.stats || {};

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-white">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Student Profile
        </h2>
        <p className="text-xs text-slate-400">Personal details and enrollment information</p>
      </div>

      <div className="bg-[#191B21] rounded-3xl p-6 sm:p-8 border border-[#262933] shadow-lg space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7A30] to-[#9B6CFF] text-white font-black text-2xl flex items-center justify-center shadow-glow-orange">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">{user?.name}</h3>
              {stats.overallStatus && <StatusBadge status={stats.overallStatus} size="small" />}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#262933]">
          <div className="p-4 bg-[#111216] rounded-2xl border border-[#262933] space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Student ID</div>
            <div className="text-sm font-black text-[#FF7A30]">{student.student_id || 'ST001'}</div>
          </div>
          <div className="p-4 bg-[#111216] rounded-2xl border border-[#262933] space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Department</div>
            <div className="text-sm font-bold text-white">{student.department || 'Computer Science'}</div>
          </div>
          <div className="p-4 bg-[#111216] rounded-2xl border border-[#262933] space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Semester & Section</div>
            <div className="text-sm font-bold text-white">Semester {student.semester || '4'} (Sec {student.section || 'A'})</div>
          </div>
          <div className="p-4 bg-[#111216] rounded-2xl border border-[#262933] space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-slate-500">Overall Attendance</div>
            <div className="text-sm font-black text-[#35D07F]">{stats.overallPercentage || 0}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
