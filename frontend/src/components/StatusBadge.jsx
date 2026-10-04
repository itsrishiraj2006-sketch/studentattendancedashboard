import React from 'react';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function StatusBadge({ status, size = 'normal' }) {
  const config = getStatusBadgeConfig(status);

  const sizeClasses = size === 'small'
    ? 'px-2 py-0.5 text-[10px] font-extrabold'
    : 'px-3 py-1 text-xs font-extrabold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.bar}`} style={{ boxShadow: config.glow }} />
      <span>{config.label}</span>
    </span>
  );
}
