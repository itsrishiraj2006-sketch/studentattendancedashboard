import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import api from '../services/api';

import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import SubjectDetailsModal from './SubjectDetailsModal';

// Premium D3 Visualization Components
import RadialAttendanceVisualization from '../charts/RadialAttendanceVisualization';
import HexagonSubjectCard from '../charts/HexagonSubjectCard';
import SubjectAttendanceLandscape from '../charts/SubjectAttendanceLandscape';
import AttendanceBarVisualization from '../charts/AttendanceBarVisualization';
import AttendanceWaveChart from '../charts/AttendanceWaveChart';
import AttendanceHeatmap from '../charts/AttendanceHeatmap';
import AttendanceRadarChart from '../charts/AttendanceRadarChart';
import AttendanceCategoryFilter from '../charts/AttendanceCategoryFilter';

import { Percent, BookOpen, CheckCircle, XCircle, Search, Sparkles, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { thresholds } = useConfig();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters state
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchSubject, setSearchSubject] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Selected subject modal
  const [selectedSubject, setSelectedSubject] = useState(null);

  const fetchStudentData = async () => {
    try {
      const studentId = user?.studentDetails?.id || user?.id;
      const res = await api.get(`/analytics/student/${studentId}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <div className="w-12 h-12 border-4 border-[#FF7A30] border-t-transparent rounded-full animate-spin mb-4 shadow-glow-orange" />
        <p className="text-xs font-bold text-slate-400 tracking-wider">Loading D3.js Visualization Engine...</p>
      </div>
    );
  }

  const student = data?.student || user?.studentDetails || {};
  const stats = data?.stats || {
    overallPercentage: 0,
    overallStatus: 'HIGH',
    totalClasses: 0,
    totalAttended: 0,
    totalMissed: 0,
    subjectStats: [],
    categoryCounts: { HIGH: 0, AVERAGE: 0, LOW: 0 }
  };

  const rawHistory = data?.stats?.attendanceHistory || [];

  // Filter subjects by Category and Search query
  const filteredSubjects = stats.subjectStats.filter(sub => {
    const matchesCategory = activeCategory === 'ALL' || sub.status === activeCategory;
    const matchesSearch =
      sub.name.toLowerCase().includes(searchSubject.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchSubject.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter Attendance History
  let filteredHistory = rawHistory;
  if (subjectFilter !== 'ALL') {
    filteredHistory = filteredHistory.filter(h => String(h.subject_id) === String(subjectFilter));
  }
  if (statusFilter !== 'ALL') {
    filteredHistory = filteredHistory.filter(h => h.status === statusFilter);
  }
  if (dateFilter) {
    filteredHistory = filteredHistory.filter(h => h.date === dateFilter);
  }

  return (
    <div className="space-y-8">
      {/* 1. HERO VISUAL DASHBOARD HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-darkCard via-darkCard to-[#FF7A30]/10 rounded-3xl p-6 sm:p-8 border border-darkBorder shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
          {/* Hero Meta Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF7A30]/15 text-[#FF7A30] border border-[#FF7A30]/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Attendance Analytics powered by D3.js</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Student Attendance Dashboard
            </h1>

            <p className="text-sm text-slate-300 font-medium">
              "Transform attendance records into meaningful visual insights."
            </p>

            {/* Live Student Details Metadata Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder font-semibold text-slate-300">
                Student: <strong className="text-white font-bold">{student.name || user?.name}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder font-semibold text-slate-300">
                ID: <strong className="text-[#FF7A30] font-bold">{student.student_id || 'ST001'}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder font-semibold text-slate-300">
                Dept: <strong className="text-white font-bold">{student.department || 'Computer Science'}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder font-semibold text-slate-300">
                Semester: <strong className="text-white font-bold">{student.semester || '4'}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated: <strong className="text-slate-200 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          {/* 3. HERO INTERACTIVE RADIAL ATTENDANCE VISUALIZATION */}
          <div className="flex flex-col items-center justify-center p-4 bg-darkBg/60 rounded-3xl border border-darkBorder/80">
            <RadialAttendanceVisualization
              attended={stats.totalAttended}
              missed={stats.totalMissed}
              percentage={stats.overallPercentage}
              status={stats.overallStatus}
              size={240}
            />
            <div className="mt-2 text-center">
              <StatusBadge status={stats.overallStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          icon={Percent}
          color={stats.overallStatus === 'HIGH' ? 'emerald' : stats.overallStatus === 'AVERAGE' ? 'amber' : 'rose'}
          statusBadge={<StatusBadge status={stats.overallStatus} size="small" />}
        />
        <SummaryCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="blue"
          subtitle="Conducted across all subjects"
        />
        <SummaryCard
          title="Classes Attended"
          value={stats.totalAttended}
          icon={CheckCircle}
          color="emerald"
          subtitle="Includes present & weighted late"
        />
        <SummaryCard
          title="Classes Missed"
          value={stats.totalMissed}
          icon={XCircle}
          color="rose"
          subtitle="Absences recorded"
        />
      </div>

      {/* 6. INTERACTIVE SUBJECT ATTENDANCE LANDSCAPE (D3 FORCE NETWORK) */}
      <SubjectAttendanceLandscape subjects={stats.subjectStats} height={320} />

      {/* 4 & 5 & 11. SUBJECT HEXAGON CARDS & CATEGORY FILTER */}
      <div className="space-y-4">
        <div className="bg-darkCard p-6 rounded-3xl border border-darkBorder space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                Subject Attendance Hexagon Cards
              </h2>
              <p className="text-xs text-slate-400">
                Click any subject card to inspect full detailed visual breakdown
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchSubject}
                onChange={e => setSearchSubject(e.target.value)}
                placeholder="Search subject..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-darkBg border border-darkBorder text-white focus:outline-none focus:border-[#FF7A30]"
              />
            </div>
          </div>

          {/* 11. Interactive Category Filter */}
          <AttendanceCategoryFilter
            categoryCounts={stats.categoryCounts}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>

        {/* Hexagon Subject Grid */}
        {filteredSubjects.length === 0 ? (
          <EmptyState
            title="No subjects found"
            description="No subjects match your current filter or search criteria."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map(sub => (
              <HexagonSubjectCard
                key={sub.id}
                subject={sub}
                onClick={() => setSelectedSubject(sub)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 7 & 8 & 10. D3 VISUALIZATION GRID (Bar Chart, Wave Trend, Radar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7. D3 Bar Chart */}
        <div className="lg:col-span-2 bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg">
          <h3 className="text-base font-extrabold text-white mb-1">
            Attendance by Subject (D3.js Bar Visualization)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Subject comparison with high threshold reference indicator
          </p>
          <AttendanceBarVisualization data={stats.subjectStats} height={280} />
        </div>

        {/* 10. D3 Radar Chart */}
        <div className="bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white mb-1">
              Subject Performance Radar
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Multi-axis radar evaluation across courses
            </p>
          </div>
          <AttendanceRadarChart data={stats.subjectStats} height={260} />
        </div>
      </div>

      {/* 8 & 9. WAVE TREND & ACTIVITY HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8. Attendance Wave Trend */}
        <div className="bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg">
          <h3 className="text-base font-extrabold text-white mb-1">
            Attendance Trend (Wave / Area Chart)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Cumulative percentage progress over date timeline
          </p>
          <AttendanceWaveChart data={data?.timelineData || []} height={230} />
        </div>

        {/* 9. Attendance Heatmap */}
        <div className="bg-darkCard p-6 rounded-3xl border border-darkBorder shadow-lg">
          <AttendanceHeatmap records={rawHistory} height={230} />
        </div>
      </div>

      {/* ATTENDANCE HISTORY SECTION */}
      <div className="bg-darkCard rounded-3xl p-6 border border-darkBorder shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-white">Attendance History Log</h3>
            <p className="text-xs text-slate-400">Class-by-class attendance records</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-darkBorder bg-darkBg text-slate-200 font-semibold"
            >
              <option value="ALL">All Subjects</option>
              {stats.subjectStats.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-darkBorder bg-darkBg text-slate-200 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-darkBorder bg-darkBg text-slate-200"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <EmptyState title="No history logs found" description="No attendance logs match your filter options." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-darkBg text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Date</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkBorder/60 font-medium">
                {filteredHistory.map((rec) => {
                  const sub = stats.subjectStats.find(s => s.id === rec.subject_id) || {};
                  return (
                    <tr key={rec.id} className="hover:bg-darkBg/60 transition">
                      <td className="px-4 py-3 text-slate-300">{rec.date}</td>
                      <td className="px-4 py-3 text-white font-bold">{sub.name || 'Subject'}</td>
                      <td className="px-4 py-3 text-slate-400">{sub.code || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          rec.status === 'PRESENT'
                            ? 'bg-[#35D07F]/15 text-[#35D07F] border border-[#35D07F]/30'
                            : rec.status === 'LATE'
                            ? 'bg-[#FFC857]/15 text-[#FFC857] border border-[#FFC857]/30'
                            : 'bg-[#FF5577]/15 text-[#FF5577] border border-[#FF5577]/30'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 12. INDIVIDUAL SUBJECT DETAIL VISUALIZATION MODAL */}
      {selectedSubject && (
        <SubjectDetailsModal
          subject={selectedSubject}
          studentId={student.id}
          timelineData={data?.timelineData || []}
          rawHistory={rawHistory.filter(h => h.subject_id === selectedSubject.id)}
          onClose={() => setSelectedSubject(null)}
        />
      )}
    </div>
  );
}
