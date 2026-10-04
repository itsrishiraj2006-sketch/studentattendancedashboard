import React from 'react';

export default function SummaryCard({ title, value, icon: Icon, color = 'orange', subtitle, statusBadge }) {
  const colorStyles = {
    orange: 'bg-[#FF7A30]/15 text-[#FF7A30] border-[#FF7A30]/30 shadow-glow-orange',
    blue: 'bg-[#35C9FF]/15 text-[#35C9FF] border-[#35C9FF]/30 shadow-glow-blue',
    purple: 'bg-[#9B6CFF]/15 text-[#9B6CFF] border-[#9B6CFF]/30 shadow-glow-purple',
    emerald: 'bg-[#35D07F]/15 text-[#35D07F] border-[#35D07F]/30 shadow-glow-green',
    rose: 'bg-[#FF5577]/15 text-[#FF5577] border-[#FF5577]/30 shadow-glow-danger',
    amber: 'bg-[#FFC857]/15 text-[#FFC857] border-[#FFC857]/30',
  };

  return (
    <div className="bg-[#191B21] rounded-3xl p-5 border border-[#262933] shadow-lg hover:border-[#FF7A30]/40 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-2xl border ${colorStyles[color] || colorStyles.orange}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-3xl font-black text-white tracking-tight">
          {value}
        </div>
        {statusBadge}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
