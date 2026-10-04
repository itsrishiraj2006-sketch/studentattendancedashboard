import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({ title = 'No records found', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#191B21]/60 rounded-3xl border border-dashed border-[#262933] my-4">
      <div className="p-4 bg-[#111216] rounded-full text-[#FF7A30] mb-3 border border-[#262933]">
        <FolderOpen className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-400 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
