import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function HexagonSubjectCard({ subject, onClick }) {
  const svgRef = useRef(null);
  const statusConfig = getStatusBadgeConfig(subject.status);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const size = 64;
    const radius = size / 2;
    const strokeWidth = 5;

    const g = svg
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${radius}, ${radius})`);

    // Background track
    const arcBg = d3
      .arc()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append('path').attr('d', arcBg).attr('fill', '#262933');

    // Progress Arc
    const progressAngle = (subject.percentage / 100) * 2 * Math.PI;

    const arcProgress = d3
      .arc()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(progressAngle)
      .cornerRadius(4);

    g.append('path')
      .attr('d', arcProgress)
      .attr('fill', statusConfig.color)
      .style('filter', `drop-shadow(0 0 4px ${statusConfig.color})`);

  }, [subject, statusConfig]);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer p-0.5 rounded-2xl bg-gradient-to-br from-darkBorder via-darkCard to-[#FF7A30]/20 hover:to-[#FF7A30]/60 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-glow-orange"
    >
      <div className="bg-darkCard rounded-[15px] p-5 border border-darkBorder/80 group-hover:border-[#FF7A30]/40 transition flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-darkBg text-slate-400 border border-darkBorder">
                {subject.code}
              </span>
              <h4 className="text-base font-bold text-white mt-2 leading-tight group-hover:text-[#FF7A30] transition-colors">
                {subject.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Faculty: {subject.faculty_name || 'Faculty'}</p>
            </div>

            {/* Mini D3 Radial Gauge */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg ref={svgRef} />
              <span className="absolute text-[11px] font-extrabold text-white">
                {Math.round(subject.percentage)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
              <span>Attendance Rate</span>
              <span className="font-bold text-white">{subject.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-darkBg rounded-full overflow-hidden border border-darkBorder">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width: `${Math.min(100, subject.percentage)}%`,
                  backgroundColor: statusConfig.color,
                  boxShadow: statusConfig.glow
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-darkBorder/60 text-center">
          <div className="bg-darkBg/60 p-2 rounded-xl border border-darkBorder/40">
            <div className="text-[9px] uppercase font-bold text-slate-500">Attended</div>
            <div className="text-xs font-extrabold text-[#35D07F]">{subject.attended_classes || subject.attended || 0}</div>
          </div>
          <div className="bg-darkBg/60 p-2 rounded-xl border border-darkBorder/40">
            <div className="text-[9px] uppercase font-bold text-slate-500">Missed</div>
            <div className="text-xs font-extrabold text-[#FF5577]">{subject.missed_classes || subject.missed || 0}</div>
          </div>
          <div className="bg-darkBg/60 p-2 rounded-xl border border-darkBorder/40">
            <div className="text-[9px] uppercase font-bold text-slate-500">Total</div>
            <div className="text-xs font-extrabold text-white">{subject.total_classes || subject.totalClasses || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
