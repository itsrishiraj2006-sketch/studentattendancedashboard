import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Calendar, BookOpen, CheckSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function MarkAttendance() {
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sectionFilter, setSectionFilter] = useState('ALL');

  // Attendance state map { studentId: 'PRESENT' | 'ABSENT' | 'LATE' }
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, stRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/students')
        ]);
        const subList = subRes.data.subjects || [];
        const stList = stRes.data.students || [];

        setSubjects(subList);
        setStudents(stList);

        if (subList.length > 0) {
          setSelectedSubjectId(String(subList[0].id));
        }

        const initMap = {};
        stList.forEach(s => {
          initMap[s.id] = 'PRESENT';
        });
        setAttendanceMap(initMap);
      } catch (err) {
        addToast('Failed to load subjects or students.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchExisting() {
      if (!selectedSubjectId || !date) return;
      try {
        const res = await api.get(`/attendance?subject_id=${selectedSubjectId}&date=${date}`);
        const existing = res.data.attendance || [];

        if (existing.length > 0) {
          setAttendanceMap(prev => {
            const updated = { ...prev };
            existing.forEach(rec => {
              updated[rec.student_id] = rec.status;
            });
            return updated;
          });
          addToast(`Loaded existing attendance logs for ${date}.`, 'info');
        }
      } catch (err) {
        // quiet fallback
      }
    }
    fetchExisting();
  }, [selectedSubjectId, date]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceMap };
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
    addToast(`Marked all students as ${status}.`, 'info');
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !date) {
      addToast('Please select both a Subject and Date.', 'error');
      return;
    }

    const payloadRecords = Object.keys(attendanceMap).map(stId => ({
      student_id: parseInt(stId, 10),
      status: attendanceMap[stId]
    }));

    setSaving(true);
    try {
      await api.post('/attendance', {
        subject_id: parseInt(selectedSubjectId, 10),
        date,
        records: payloadRecords
      });
      addToast('Attendance saved successfully to database!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save attendance.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = sectionFilter === 'ALL'
    ? students
    : students.filter(s => s.section === sectionFilter);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading attendance sheet...</div>;
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Mark Attendance
        </h2>
        <p className="text-xs text-slate-400">
          Select subject, date, and toggle student presence status
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-[#191B21] p-6 rounded-3xl border border-[#262933] shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Select Subject *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-xs font-bold text-white"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} ({sub.faculty_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Attendance Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] text-xs font-bold text-white"
              />
            </div>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Filter Section
            </label>
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-xs font-bold text-white"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>

        {/* Quick Batch Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262933]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Quick Actions:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-[#35D07F]/15 text-[#35D07F] border border-[#35D07F]/30 hover:bg-[#35D07F]/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 bg-[#FF5577]/15 text-[#FF5577] border border-[#FF5577]/30 hover:bg-[#FF5577]/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              Mark All Absent
            </button>
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={saving}
            className="px-6 py-2.5 bg-[#FF7A30] hover:bg-[#FF7A30]/90 text-white font-black text-xs rounded-xl shadow-glow-orange transition flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            <span>Submit Attendance</span>
          </button>
        </div>
      </div>

      {/* Student Marking Table */}
      <div className="bg-[#191B21] rounded-3xl border border-[#262933] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111216] text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Department & Sem</th>
                <th className="px-6 py-4 text-center">Status Selection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262933] font-medium">
              {filteredStudents.map((st) => {
                const currentStatus = attendanceMap[st.id] || 'PRESENT';

                return (
                  <tr key={st.id} className="hover:bg-[#111216]/60 transition">
                    <td className="px-6 py-4 font-black text-[#FF7A30]">
                      {st.student_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {st.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {st.department} (Sem {st.semester} - {st.section})
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'PRESENT')}
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1 ${
                            currentStatus === 'PRESENT'
                              ? 'bg-[#35D07F] text-white shadow-glow-green'
                              : 'bg-[#111216] text-slate-400 hover:text-white border border-[#262933]'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'ABSENT')}
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1 ${
                            currentStatus === 'ABSENT'
                              ? 'bg-[#FF5577] text-white shadow-glow-danger'
                              : 'bg-[#111216] text-slate-400 hover:text-white border border-[#262933]'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'LATE')}
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1 ${
                            currentStatus === 'LATE'
                              ? 'bg-[#FFC857] text-black font-black'
                              : 'bg-[#111216] text-slate-400 hover:text-white border border-[#262933]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
