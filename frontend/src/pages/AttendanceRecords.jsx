import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Search, Filter, Calendar, Edit, Trash2 } from 'lucide-react';

export default function AttendanceRecords() {
  const { addToast } = useToast();
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('PRESENT');

  const fetchRecords = async () => {
    try {
      const [attRes, subRes, stRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/subjects'),
        api.get('/students')
      ]);
      setRecords(attRes.data.attendance || []);
      setSubjects(subRes.data.subjects || []);
      setStudents(stRes.data.students || []);
    } catch (err) {
      addToast('Failed to load attendance records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await api.put(`/attendance/${selectedRecord.id}`, { status: newStatus });
      addToast('Attendance record updated successfully.', 'success');
      setEditModalOpen(false);
      fetchRecords();
    } catch (err) {
      addToast('Failed to update record.', 'error');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await api.delete(`/attendance/${id}`);
        addToast('Record deleted.', 'success');
        fetchRecords();
      } catch (err) {
        addToast('Failed to delete record.', 'error');
      }
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSub = !subjectFilter || String(r.subject_id) === String(subjectFilter);
    const matchesSt = !studentFilter || String(r.student_id) === String(studentFilter);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesDate = !dateFilter || r.date === dateFilter;
    return matchesSub && matchesSt && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Attendance Records Log
        </h2>
        <p className="text-xs text-slate-400">
          Complete database history of all recorded attendance sessions
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#191B21] p-4 rounded-3xl border border-[#262933] shadow-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
          ))}
        </select>

        <select
          value={studentFilter}
          onChange={e => setStudentFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
        >
          <option value="">All Students</option>
          {students.map(st => (
            <option key={st.id} value={st.id}>{st.student_id} - {st.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] text-slate-200"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading attendance logs...</div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState title="No records found" description="No attendance logs match your filter criteria." />
      ) : (
        <div className="bg-[#191B21] rounded-3xl border border-[#262933] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111216] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Student ID & Name</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262933] font-medium">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#111216]/60 transition">
                    <td className="px-5 py-3.5 text-slate-300">{rec.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{rec.student_name}</div>
                      <div className="text-[11px] text-[#FF7A30] font-semibold">{rec.student_code_id}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-200">
                      {rec.subject_name} ({rec.subject_code})
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        rec.status === 'PRESENT'
                          ? 'bg-[#35D07F]/15 text-[#35D07F] border border-[#35D07F]/30'
                          : rec.status === 'LATE'
                          ? 'bg-[#FFC857]/15 text-[#FFC857] border border-[#FFC857]/30'
                          : 'bg-[#FF5577]/15 text-[#FF5577] border border-[#FF5577]/30'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setNewStatus(rec.status);
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 text-[#FFC857] hover:bg-[#FFC857]/20 rounded-lg transition"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1.5 text-[#FF5577] hover:bg-[#FF5577]/20 rounded-lg transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Attendance Status">
        {selectedRecord && (
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div className="p-3 bg-[#111216] rounded-xl text-xs space-y-1 border border-[#262933]">
              <div>Student: <strong className="text-white">{selectedRecord.student_name}</strong></div>
              <div>Subject: <strong className="text-white">{selectedRecord.subject_name}</strong></div>
              <div>Date: <strong className="text-white">{selectedRecord.date}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-xs font-bold text-white"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#FF7A30] text-white rounded-xl shadow-glow-orange"
              >
                Save Record
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
