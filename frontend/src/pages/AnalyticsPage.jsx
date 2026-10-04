import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AttendanceBarVisualization from '../charts/AttendanceBarVisualization';
import AttendanceCategoryFilter from '../charts/AttendanceCategoryFilter';
import SubjectAttendanceLandscape from '../charts/SubjectAttendanceLandscape';
import Modal from '../components/Modal';
import RadialAttendanceVisualization from '../charts/RadialAttendanceVisualization';
import { Search, Filter, Eye, AlertTriangle, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('percentage_desc');

  // View Student Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [detailedStudentData, setDetailedStudentData] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/class');
      setData(res.data);
    } catch (err) {
      console.error('Error loading class analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleViewStudent = async (st) => {
    setSelectedStudent(st);
    setStudentModalOpen(true);
    try {
      const res = await api.get(`/analytics/student/${st.id}`);
      setDetailedStudentData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading class analytics...</div>;
  }

  const studentBreakdown = data?.studentBreakdown || [];

  let filteredStudents = studentBreakdown.filter(st => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.student_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || st.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filteredStudents.sort((a, b) => {
    if (sortBy === 'percentage_desc') return b.overallPercentage - a.overallPercentage;
    if (sortBy === 'percentage_asc') return a.overallPercentage - b.overallPercentage;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Class & Teacher Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Comprehensive performance evaluation, subject comparison, and low attendance monitoring
        </p>
      </div>

      {/* Top Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Low Attendance Highlight Card */}
        <div className="bg-[#FF5577]/10 rounded-3xl p-5 border border-[#FF5577]/30 shadow-glow-danger">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF5577]" />
              <h3 className="text-sm font-extrabold text-white">
                Low Attendance List (&lt;60%)
              </h3>
            </div>
            <span className="text-xs font-bold text-[#FF5577]">
              {data?.lowAttendanceStudents?.length || 0} students
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {data?.lowAttendanceStudents?.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No students currently in low attendance range.</p>
            ) : (
              data?.lowAttendanceStudents?.map(st => (
                <div key={st.id} className="flex items-center justify-between bg-[#191B21] p-2.5 rounded-xl border border-[#FF5577]/20 text-xs">
                  <div>
                    <div className="font-bold text-white">{st.name}</div>
                    <div className="text-[10px] text-slate-400">{st.student_id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#FF5577]">{st.overallPercentage}%</span>
                    <button
                      onClick={() => handleViewStudent(st)}
                      className="p-1 text-slate-400 hover:text-[#FF7A30]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Attendance Highlight Card */}
        <div className="bg-[#35D07F]/10 rounded-3xl p-5 border border-[#35D07F]/30 shadow-glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#35D07F]" />
              <h3 className="text-sm font-extrabold text-white">
                High Attendance List (&gt;=75%)
              </h3>
            </div>
            <span className="text-xs font-bold text-[#35D07F]">
              {data?.highAttendanceStudents?.length || 0} students
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {data?.highAttendanceStudents?.slice(0, 5).map(st => (
              <div key={st.id} className="flex items-center justify-between bg-[#191B21] p-2.5 rounded-xl border border-[#35D07F]/20 text-xs">
                <div>
                  <div className="font-bold text-white">{st.name}</div>
                  <div className="text-[10px] text-slate-400">{st.student_id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#35D07F]">{st.overallPercentage}%</span>
                  <button
                    onClick={() => handleViewStudent(st)}
                    className="p-1 text-slate-400 hover:text-[#FF7A30]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Filter */}
        <div className="bg-[#191B21] rounded-3xl p-5 border border-[#262933]">
          <AttendanceCategoryFilter
            categoryCounts={{
              HIGH: data?.summary?.highAttendanceCount || 0,
              AVERAGE: data?.summary?.averageAttendanceCount || 0,
              LOW: data?.summary?.lowAttendanceCount || 0
            }}
          />
        </div>
      </div>

      {/* Network Landscape */}
      <SubjectAttendanceLandscape subjects={data?.subjectBreakdown || []} height={300} />

      {/* D3 Subject Bar Chart */}
      <div className="bg-[#191B21] p-6 rounded-3xl border border-[#262933] shadow-lg">
        <h3 className="text-base font-extrabold text-white mb-1">
          Class Attendance Across Subjects (D3.js Visualization)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Hover over bars to inspect attended vs missed class details
        </p>
        <AttendanceBarVisualization data={data?.subjectBreakdown || []} height={280} />
      </div>

      {/* Student Table */}
      <div className="bg-[#191B21] rounded-3xl p-6 border border-[#262933] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-extrabold text-white">
            Student Attendance Analytics Table
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#262933] bg-[#111216] text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="HIGH">High Attendance</option>
              <option value="AVERAGE">Average Attendance</option>
              <option value="LOW">Low Attendance</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
            >
              <option value="percentage_desc">Sort: Highest % First</option>
              <option value="percentage_asc">Sort: Lowest % First</option>
              <option value="name">Sort: Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111216] text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Student ID</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Overall Attendance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262933] font-medium">
              {filteredStudents.map(st => (
                <tr key={st.id} className="hover:bg-[#111216]/60 transition">
                  <td className="px-5 py-3.5 font-bold text-white">
                    {st.name}
                  </td>
                  <td className="px-5 py-3.5 text-[#FF7A30] font-bold">{st.student_id}</td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {st.department} (Sem {st.semester})
                  </td>
                  <td className="px-5 py-3.5 font-black text-white">
                    {st.overallPercentage}%
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={st.overallStatus} size="small" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleViewStudent(st)}
                      className="px-3 py-1.5 bg-[#FF7A30]/15 text-[#FF7A30] border border-[#FF7A30]/30 hover:bg-[#FF7A30]/25 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Modal */}
      <Modal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        title={`Student Analytics: ${selectedStudent?.name || ''}`}
        maxWidth="max-w-4xl"
      >
        {detailedStudentData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#111216] rounded-2xl border border-[#262933]">
              <div>
                <div className="text-base font-bold text-white">
                  {detailedStudentData.student.name} ({detailedStudentData.student.student_id})
                </div>
                <div className="text-xs text-slate-400">
                  {detailedStudentData.student.department} | Semester {detailedStudentData.student.semester}
                </div>
              </div>
              <StatusBadge status={detailedStudentData.stats.overallStatus} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-[#111216] rounded-2xl border border-[#262933]">
                <RadialAttendanceVisualization
                  attended={detailedStudentData.stats.totalAttended}
                  missed={detailedStudentData.stats.totalMissed}
                  percentage={detailedStudentData.stats.overallPercentage}
                  status={detailedStudentData.stats.overallStatus}
                  size={180}
                />
              </div>
              <div className="md:col-span-2 p-4 bg-[#111216] rounded-2xl border border-[#262933]">
                <AttendanceBarVisualization data={detailedStudentData.stats.subjectStats} height={200} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">Loading student details...</div>
        )}
      </Modal>
    </div>
  );
}
