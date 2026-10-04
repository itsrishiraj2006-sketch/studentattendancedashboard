import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import AttendanceBarVisualization from '../charts/AttendanceBarVisualization';
import SubjectAttendanceLandscape from '../charts/SubjectAttendanceLandscape';
import AttendanceRadarChart from '../charts/AttendanceRadarChart';

import { Users, BookOpen, BarChart2, AlertTriangle, ArrowRight, CheckSquare, PlusCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const fetchData = async () => {
    try {
      const [classRes, alertRes] = await Promise.all([
        api.get('/analytics/class'),
        api.get('/analytics/alerts')
      ]);
      setData(classRes.data);
      setAlerts(alertRes.data.alerts || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <div className="w-12 h-12 border-4 border-[#9B6CFF] border-t-transparent rounded-full animate-spin mb-4 shadow-glow-purple" />
        <p className="text-xs font-bold text-slate-400 tracking-wider">Loading Teacher Control Center...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalStudents: 0,
    totalSubjects: 0,
    avgClassAttendance: 0,
    lowAttendanceCount: 0
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-darkCard via-darkCard to-[#9B6CFF]/15 rounded-3xl p-6 sm:p-8 border border-darkBorder shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9B6CFF]/15 text-[#9B6CFF] border border-[#9B6CFF]/30 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin & Faculty Control Hub</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Teacher & Admin Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Department: Computer Science & Engineering | Real-time Class Performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/mark-attendance"
            className="px-4 py-3 bg-[#FF7A30] hover:bg-[#FF7A30]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-orange flex items-center gap-2 transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/subjects"
            className="px-4 py-3 bg-[#9B6CFF] hover:bg-[#9B6CFF]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-purple flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Subject</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Students"
          value={summary.totalStudents}
          icon={Users}
          color="blue"
          subtitle="Enrolled student accounts"
        />
        <SummaryCard
          title="Total Subjects"
          value={summary.totalSubjects}
          icon={BookOpen}
          color="purple"
          subtitle="Active course curriculum"
        />
        <SummaryCard
          title="Average Attendance"
          value={`${summary.avgClassAttendance}%`}
          icon={BarChart2}
          color={summary.avgClassAttendance >= 75 ? 'emerald' : summary.avgClassAttendance >= 60 ? 'amber' : 'rose'}
          subtitle="Overall class average"
        />
        <SummaryCard
          title="Low Attendance Students"
          value={summary.lowAttendanceCount}
          icon={AlertTriangle}
          color="rose"
          subtitle="Students falling below <60%"
        />
      </div>

      {/* Low Attendance Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-[#FF5577]/10 border border-[#FF5577]/30 rounded-3xl p-6 shadow-glow-danger">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#FF5577]" />
            <h3 className="text-base font-extrabold text-white">
              Low Attendance Critical Alerts ({alerts.length} Records)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((alert, idx) => (
              <div
                key={idx}
                className="bg-darkCard p-3.5 rounded-2xl border border-[#FF5577]/20 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {alert.student_name} ({alert.student_id})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Subject: <strong className="text-slate-200">{alert.subject_name}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#FF5577]">
                    {alert.percentage}%
                  </span>
                  <div className="text-[9px] text-[#FF5577] uppercase font-bold">Critical</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Landscape Map */}
      <SubjectAttendanceLandscape subjects={data?.subjectBreakdown || []} height={300} />

      {/* D3 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg">
          <h3 className="text-base font-extrabold text-white mb-1">
            Class Attendance Across Subjects (D3 Bar Visualization)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Subject performance comparison with high target indicator
          </p>
          <AttendanceBarVisualization data={data?.subjectBreakdown || []} height={260} />
        </div>

        {/* Quick Management & Radar */}
        <div className="bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-white mb-3">
              Quick Management Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                to="/students"
                className="flex items-center justify-between p-3 rounded-2xl bg-darkBg hover:bg-darkHover border border-darkBorder transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#35C9FF]" />
                  <span className="text-xs font-bold text-white">Manage Students</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                to="/subjects"
                className="flex items-center justify-between p-3 rounded-2xl bg-darkBg hover:bg-darkHover border border-darkBorder transition"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-[#9B6CFF]" />
                  <span className="text-xs font-bold text-white">Manage Subjects</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-3 rounded-2xl bg-darkBg hover:bg-darkHover border border-darkBorder transition"
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4 text-[#35D07F]" />
                  <span className="text-xs font-bold text-white">Export CSV & PDF Reports</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-darkBorder text-center">
            <div className="text-xs font-bold text-slate-400 mb-2">Category Count Summary</div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-lg font-black text-[#35D07F]">{data?.summary?.highAttendanceCount || 0}</div>
                <div className="text-[10px] text-slate-500 font-bold">HIGH</div>
              </div>
              <div>
                <div className="text-lg font-black text-[#FFC857]">{data?.summary?.averageAttendanceCount || 0}</div>
                <div className="text-[10px] text-slate-500 font-bold">AVERAGE</div>
              </div>
              <div>
                <div className="text-lg font-black text-[#FF5577]">{data?.summary?.lowAttendanceCount || 0}</div>
                <div className="text-[10px] text-slate-500 font-bold">LOW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
