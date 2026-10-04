import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import RadialAttendanceVisualization from '../charts/RadialAttendanceVisualization';
import AttendanceBarVisualization from '../charts/AttendanceBarVisualization';
import { Plus, Search, Filter, Edit, Trash2, Eye, UserPlus } from 'lucide-react';

export default function ManageStudents() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailedStudentData, setDetailedStudentData] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    department: 'Computer Science',
    semester: '4',
    section: 'A',
    password: 'password123'
  });

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.students || []);
    } catch (err) {
      addToast('Failed to fetch students.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      addToast('Student added successfully.', 'success');
      setAddModalOpen(false);
      setFormData({
        name: '',
        student_id: '',
        email: '',
        department: 'Computer Science',
        semester: '4',
        section: 'A',
        password: 'password123'
      });
      fetchStudents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create student.', 'error');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.put(`/students/${selectedStudent.id}`, formData);
      addToast('Student updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update student.', 'error');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      try {
        await api.delete(`/students/${id}`);
        addToast('Student deleted successfully.', 'success');
        fetchStudents();
      } catch (err) {
        addToast('Failed to delete student.', 'error');
      }
    }
  };

  const handleViewStudentDetails = async (st) => {
    setSelectedStudent(st);
    setViewModalOpen(true);
    try {
      const res = await api.get(`/analytics/student/${st.id}`);
      setDetailedStudentData(res.data);
    } catch (err) {
      addToast('Error fetching student details.', 'error');
    }
  };

  const filteredStudents = students.filter(st => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.student_id.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !departmentFilter || st.department === departmentFilter;
    const matchesSem = !semesterFilter || String(st.semester) === String(semesterFilter);
    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <div className="space-y-6 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Manage Students
          </h2>
          <p className="text-xs text-slate-400">Create, edit, search and monitor student records</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              student_id: `ST0${students.length + 1}`,
              email: '',
              department: 'Computer Science',
              semester: '4',
              section: 'A',
              password: 'password123'
            });
            setAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#FF7A30] hover:bg-[#FF7A30]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-orange flex items-center gap-2 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Student</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#191B21] p-4 rounded-3xl border border-[#262933] shadow-lg flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] text-white focus:outline-none focus:border-[#FF7A30]"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full md:w-48 px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Tech">Information Tech</option>
          <option value="Cyber Security">Cyber Security</option>
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="w-full md:w-36 px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
        >
          <option value="">All Semesters</option>
          <option value="2">Semester 2</option>
          <option value="4">Semester 4</option>
          <option value="6">Semester 6</option>
          <option value="8">Semester 8</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading student records...</div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          description="No student records match your query."
          action={
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-[#FF7A30] text-white rounded-xl text-xs font-bold"
            >
              + Add Student
            </button>
          }
        />
      ) : (
        <div className="bg-[#191B21] rounded-3xl border border-[#262933] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111216] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Student ID</th>
                  <th className="px-5 py-3.5">Name & Email</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Semester</th>
                  <th className="px-5 py-3.5">Overall %</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262933] font-medium">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-[#111216]/60 transition">
                    <td className="px-5 py-4 font-extrabold text-[#FF7A30]">
                      {st.student_id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{st.name}</div>
                      <div className="text-[11px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{st.department}</td>
                    <td className="px-5 py-4 text-slate-300">Sem {st.semester} ({st.section})</td>
                    <td className="px-5 py-4 font-black text-white">
                      {st.overallPercentage}%
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={st.overallStatus} size="small" />
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewStudentDetails(st)}
                        className="p-1.5 text-[#35C9FF] hover:bg-[#35C9FF]/20 rounded-lg transition"
                        title="View Analytics"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(st);
                          setFormData({
                            name: st.name,
                            student_id: st.student_id,
                            email: st.email,
                            department: st.department,
                            semester: st.semester,
                            section: st.section || 'A',
                            password: ''
                          });
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 text-[#FFC857] hover:bg-[#FFC857]/20 rounded-lg transition"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 text-[#FF5577] hover:bg-[#FF5577]/20 rounded-lg transition"
                        title="Delete Student"
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

      {/* Modal: Add Student */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Student">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white focus:border-[#FF7A30]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Student ID *
              </label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g. ST011"
                className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white focus:border-[#FF7A30]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white focus:border-[#FF7A30]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#FF7A30] text-white rounded-xl shadow-glow-orange"
            >
              Create Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Student */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Student">
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
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
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Student Analytics Details */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
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
          <div className="p-8 text-center text-xs text-slate-400">Loading details...</div>
        )}
      </Modal>
    </div>
  );
}
