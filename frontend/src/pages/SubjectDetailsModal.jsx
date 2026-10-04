import React from 'react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import RadialAttendanceVisualization from '../charts/RadialAttendanceVisualization';
import AttendanceWaveChart from '../charts/AttendanceWaveChart';
import AttendanceHeatmap from '../charts/AttendanceHeatmap';
import { BookOpen, User, Percent, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SubjectDetailsModal({ subject, timelineData = [], rawHistory = [], onClose }) {
  if (!subject) return null;

  return (
    <Modal isOpen={!!subject} onClose={onClose} title={`Subject Analytics: ${subject.name}`} maxWidth="max-w-4xl">
      <div className="space-y-6 text-white">
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-darkBg rounded-2xl border border-darkBorder">
          <div>
            <span className="text-xs font-black text-[#FF7A30] uppercase tracking-wider">
              {subject.code}
            </span>
            <h3 className="text-2xl font-black text-white mt-1">
              {subject.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#FF7A30]" />
              <span>Faculty: <strong className="text-white">{subject.faculty_name || 'Faculty Member'}</strong></span>
            </p>
          </div>
          <StatusBadge status={subject.status} />
        </div>

        {/* 4 Key Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-darkBg rounded-2xl border border-darkBorder">
            <div className="text-[10px] uppercase font-bold text-slate-400">Attendance Rate</div>
            <div className="text-xl font-black text-[#FF7A30] mt-1">{subject.percentage}%</div>
          </div>
          <div className="p-4 bg-darkBg rounded-2xl border border-darkBorder">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Classes</div>
            <div className="text-xl font-black text-white mt-1">{subject.total_classes || subject.totalClasses}</div>
          </div>
          <div className="p-4 bg-darkBg rounded-2xl border border-darkBorder">
            <div className="text-[10px] uppercase font-bold text-slate-400">Attended</div>
            <div className="text-xl font-black text-[#35D07F] mt-1">{subject.attended_classes || subject.attended}</div>
          </div>
          <div className="p-4 bg-darkBg rounded-2xl border border-darkBorder">
            <div className="text-[10px] uppercase font-bold text-slate-400">Missed</div>
            <div className="text-xl font-black text-[#FF5577] mt-1">{subject.missed_classes || subject.missed}</div>
          </div>
        </div>

        {/* Visualization 1 & 3: Large Radial & Present vs Absent Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="flex flex-col items-center justify-center p-5 bg-darkBg rounded-2xl border border-darkBorder">
            <h4 className="text-xs font-bold text-slate-300 mb-2">
              Visualization 1: Radial Attendance
            </h4>
            <RadialAttendanceVisualization
              attended={subject.attended_classes || subject.attended || 0}
              missed={subject.missed_classes || subject.missed || 0}
              late={subject.late_classes || 0}
              percentage={subject.percentage}
              status={subject.status}
              size={200}
            />
          </div>

          <div className="md:col-span-2 p-5 bg-darkBg rounded-2xl border border-darkBorder space-y-3">
            <h4 className="text-xs font-bold text-slate-300">
              Visualization 3: Present vs Absent Breakdown
            </h4>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#35D07F]">Attended Classes ({subject.attended_classes || subject.attended || 0})</span>
                  <span>{((subject.attended_classes / (subject.total_classes || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-darkCard rounded-full overflow-hidden border border-darkBorder">
                  <div className="h-full bg-[#35D07F] rounded-full shadow-glow-green" style={{ width: `${(subject.attended_classes / (subject.total_classes || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#FF5577]">Missed Classes ({subject.missed_classes || subject.missed || 0})</span>
                  <span>{((subject.missed_classes / (subject.total_classes || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-darkCard rounded-full overflow-hidden border border-darkBorder">
                  <div className="h-full bg-[#FF5577] rounded-full shadow-glow-danger" style={{ width: `${(subject.missed_classes / (subject.total_classes || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization 2: Attendance Timeline Wave */}
        <div className="p-5 bg-darkBg rounded-2xl border border-darkBorder">
          <h4 className="text-xs font-bold text-slate-300 mb-1">
            Visualization 2: Attendance Timeline Progress
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">Cumulative Attendance Percentage Trend</p>
          <AttendanceWaveChart data={timelineData} height={200} />
        </div>

        {/* Visualization 4: Calendar Activity Heatmap */}
        <div className="p-5 bg-darkBg rounded-2xl border border-darkBorder">
          <h4 className="text-xs font-bold text-slate-300 mb-2">
            Visualization 4: Attendance Activity Heatmap
          </h4>
          <AttendanceHeatmap records={rawHistory} height={180} />
        </div>

        {/* Visualization 5: Class-by-Class Attendance History Table */}
        <div className="p-5 bg-darkBg rounded-2xl border border-darkBorder space-y-3">
          <h4 className="text-xs font-bold text-slate-300">
            Visualization 5: Class-by-Class Log
          </h4>
          {rawHistory.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center">No individual class logs recorded.</div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-darkCard text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Session</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkBorder font-medium">
                  {rawHistory.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-darkCard/60">
                      <td className="px-3 py-2 text-slate-300">{rec.date}</td>
                      <td className="px-3 py-2 text-white">{subject.name} Session #{idx + 1}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          rec.status === 'PRESENT'
                            ? 'bg-[#35D07F]/15 text-[#35D07F]'
                            : rec.status === 'LATE'
                            ? 'bg-[#FFC857]/15 text-[#FFC857]'
                            : 'bg-[#FF5577]/15 text-[#FF5577]'
                        }`}>
                          {rec.status}
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
    </Modal>
  );
}
