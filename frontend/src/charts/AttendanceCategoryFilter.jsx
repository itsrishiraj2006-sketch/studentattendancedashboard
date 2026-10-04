import React from 'react';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function AttendanceCategoryFilter({
  categoryCounts = { HIGH: 0, AVERAGE: 0, LOW: 0 },
  activeCategory = 'ALL',
  onSelectCategory
}) {
  const categories = [
    { key: 'HIGH', label: 'HIGH ATTENDANCE', count: categoryCounts.HIGH || 0, color: '#35D07F', border: 'hover:border-[#35D07F]', bg: 'bg-[#35D07F]/10' },
    { key: 'AVERAGE', label: 'AVERAGE ATTENDANCE', count: categoryCounts.AVERAGE || 0, color: '#FFC857', border: 'hover:border-[#FFC857]', bg: 'bg-[#FFC857]/10' },
    { key: 'LOW', label: 'LOW ATTENDANCE', count: categoryCounts.LOW || 0, color: '#FF5577', border: 'hover:border-[#FF5577]', bg: 'bg-[#FF5577]/10' }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Filter By Attendance Category
        </h3>
        {activeCategory !== 'ALL' && (
          <button
            onClick={() => onSelectCategory('ALL')}
            className="text-[11px] font-semibold text-[#FF7A30] hover:underline"
          >
            Reset Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {categories.map(cat => {
          const isSelected = activeCategory === cat.key;

          return (
            <div
              key={cat.key}
              onClick={() => onSelectCategory(isSelected ? 'ALL' : cat.key)}
              className={`cursor-pointer rounded-2xl p-4 border transition-all duration-300 flex flex-col items-center justify-center text-center ${
                isSelected
                  ? 'bg-darkCard border-[#FF7A30] shadow-glow-orange scale-105'
                  : `bg-darkCard/60 border-darkBorder ${cat.border} hover:scale-[1.02]`
              }`}
            >
              {/* Outer Circular Ring */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl mb-2 transition-transform ${cat.bg}`}
                style={{ color: cat.color, boxShadow: isSelected ? `0 0 15px ${cat.color}` : 'none' }}
              >
                {cat.count}
              </div>

              <div className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: cat.color }}>
                {cat.label}
              </div>
              <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                {cat.count} {cat.count === 1 ? 'Subject' : 'Subjects'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
