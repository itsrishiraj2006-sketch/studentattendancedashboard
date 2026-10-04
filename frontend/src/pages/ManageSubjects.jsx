import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { Plus, BookOpen, Edit, Trash2, Search, User, Award, Layers } from 'lucide-react';

export default function ManageSubjects() {
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_name: 'Dr. Ramesh Kumar',
    department: 'Computer Science',
    semester: '4',
    credits: '4'
  });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      addToast('Failed to load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('Subject Name and Code are required.', 'error');
      return;
    }

    try {
      await api.post('/subjects', formData);
      addToast(`Subject "${formData.name}" added successfully!`, 'success');
      setAddModalOpen(false);
      setFormData({
        name: '',
        code: '',
        faculty_name: 'Dr. Ramesh Kumar',
        department: 'Computer Science',
        semester: '4',
        credits: '4'
      });
      fetchSubjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add subject.', 'error');
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      await api.put(`/subjects/${selectedSubject.id}`, formData);
      addToast('Subject updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedSubject(null);
      fetchSubjects();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update subject.', 'error');
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete subject "${name}"? All associated attendance logs will be removed.`)) {
      try {
        await api.delete(`/subjects/${id}`);
        addToast('Subject deleted successfully.', 'success');
        fetchSubjects();
      } catch (err) {
        addToast('Failed to delete subject.', 'error');
      }
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Manage Subjects
          </h2>
          <p className="text-xs text-slate-400">
            Add unlimited courses dynamically. Charts and analytics will immediately include new subjects.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              code: `CS20${subjects.length + 1}`,
              faculty_name: 'Dr. Ramesh Kumar',
              department: 'Computer Science',
              semester: '4',
              credits: '4'
            });
            setAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#9B6CFF] hover:bg-[#9B6CFF]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-purple flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Subject</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject by name or code..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#262933] bg-[#191B21] text-white focus:outline-none focus:border-[#9B6CFF]"
        />
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading subjects...</div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          title="No subjects added yet"
          description="Click + Add Subject to add a new course to the system."
          action={
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-[#9B6CFF] text-white rounded-xl text-xs font-bold"
            >
              + Add Subject
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#191B21] rounded-3xl p-6 border border-[#262933] shadow-lg hover:border-[#9B6CFF]/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#9B6CFF]/15 text-[#9B6CFF] border border-[#9B6CFF]/30">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedSubject(sub);
                        setFormData({
                          name: sub.name,
                          code: sub.code,
                          faculty_name: sub.faculty_name || '',
                          department: sub.department,
                          semester: sub.semester,
                          credits: String(sub.credits || '4')
                        });
                        setEditModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#FFC857] rounded-lg hover:bg-[#111216] transition"
                      title="Edit Subject"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-[#FF5577] rounded-lg hover:bg-[#111216] transition"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white mt-3 leading-tight">
                  {sub.name}
                </h3>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Faculty: <strong className="text-white">{sub.faculty_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dept: {sub.department} | Sem {sub.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Credits: {sub.credits || 3}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#262933] grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#111216] p-2 rounded-xl border border-[#262933]">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Classes</div>
                    <div className="text-xs font-black text-white">{sub.totalClasses || 0}</div>
                  </div>
                  <div className="bg-[#111216] p-2 rounded-xl border border-[#262933]">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Attended</div>
                    <div className="text-xs font-black text-[#35D07F]">{sub.attended || 0}</div>
                  </div>
                  <div className="bg-[#111216] p-2 rounded-xl border border-[#262933]">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Avg %</div>
                    <div className="text-xs font-black text-[#FF7A30]">{sub.percentage || 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Subject */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="+ Add New Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Machine Learning"
              className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white focus:border-[#9B6CFF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS206"
                className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white focus:border-[#9B6CFF]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Faculty Name
              </label>
              <input
                type="text"
                value={formData.faculty_name}
                onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                placeholder="Dr. Ramesh Kumar"
                className="w-full px-3.5 py-2 rounded-xl border border-[#262933] bg-[#111216] text-xs text-white"
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
              className="px-5 py-2 text-xs font-bold bg-[#9B6CFF] text-white rounded-xl shadow-glow-purple"
            >
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Subject */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Subject">
        <form onSubmit={handleUpdateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subject Name
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
              className="px-5 py-2 text-xs font-bold bg-[#9B6CFF] text-white rounded-xl shadow-glow-purple"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
