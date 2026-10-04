import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileText, Download, Printer } from 'lucide-react';

export default function ReportsPage() {
  const { addToast } = useToast();
  const [reportType, setReportType] = useState('all');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports?type=${reportType}&department=${department}`);
      setReportData(res.data.data || []);
    } catch (err) {
      addToast('Failed to fetch report data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, department]);

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      addToast('No report data available to export.', 'error');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Department',
      'Semester',
      'Subject Code',
      'Subject Name',
      'Total Classes',
      'Attended Classes',
      'Missed Classes',
      'Attendance %',
      'Status'
    ];

    const rows = reportData.map(r => [
      `"${r.student_id}"`,
      `"${r.student_name}"`,
      `"${r.department}"`,
      `"${r.semester}"`,
      `"${r.subject_code}"`,
      `"${r.subject_name}"`,
      r.total_classes,
      r.attended_classes,
      r.missed_classes,
      `"${r.attendance_percentage}%"`,
      `"${r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('CSV Report exported successfully!', 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Generate Reports
          </h2>
          <p className="text-xs text-slate-400">
            Export student, subject, and low attendance performance data to CSV or PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#35D07F] hover:bg-[#35D07F]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-green flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-[#FF7A30] hover:bg-[#FF7A30]/90 text-white font-extrabold text-xs rounded-2xl shadow-glow-orange flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#191B21] p-4 rounded-3xl border border-[#262933] shadow-lg flex flex-wrap items-center gap-4 no-print">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Report Category</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
          >
            <option value="all">Complete Attendance Report</option>
            <option value="low">Low Attendance Exception Report (&lt;60%)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Filter</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#262933] bg-[#111216] font-semibold text-slate-200"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Tech">Information Tech</option>
            <option value="Cyber Security">Cyber Security</option>
          </select>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-[#191B21] rounded-3xl p-6 border border-[#262933] shadow-lg space-y-4">
        <div className="border-b border-[#262933] pb-4 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              Student Attendance Official Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generated on: {new Date().toLocaleDateString()} | Type: {reportType.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            Total Records: <strong className="text-white font-bold">{reportData.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Compiling report data...</div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No report records match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111216] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Dept & Sem</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">Attended / Total</th>
                  <th className="px-4 py-3 text-right">Attendance %</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262933] font-medium">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#111216]/60 transition">
                    <td className="px-4 py-3 font-extrabold text-[#FF7A30]">{row.student_id}</td>
                    <td className="px-4 py-3 font-bold text-white">{row.student_name}</td>
                    <td className="px-4 py-3 text-slate-400">{row.department} (Sem {row.semester})</td>
                    <td className="px-4 py-3 text-slate-200">{row.subject_name} ({row.subject_code})</td>
                    <td className="px-4 py-3 text-center">{row.attended_classes} / {row.total_classes}</td>
                    <td className="px-4 py-3 text-right font-black text-white">{row.attendance_percentage}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        row.status === 'HIGH'
                          ? 'bg-[#35D07F]/15 text-[#35D07F]'
                          : row.status === 'AVERAGE'
                          ? 'bg-[#FFC857]/15 text-[#FFC857]'
                          : 'bg-[#FF5577]/15 text-[#FF5577]'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
