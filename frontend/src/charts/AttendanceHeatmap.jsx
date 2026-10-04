import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function AttendanceHeatmap({ records = [], height = 220 }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Group records or generate grid cells for past 30 days
    const cellSize = Math.max(16, Math.min(26, Math.floor((width - 80) / 12)));
    const margin = { top: 30, right: 20, bottom: 20, left: 40 };

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Prepare heatmap grid dataset
    const displayRecords = records.length > 0 ? records.slice(0, 36) : Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      subject_name: 'Data Structures',
      status: i % 7 === 0 ? 'ABSENT' : i % 5 === 0 ? 'LATE' : 'PRESENT'
    }));

    const cols = Math.floor((width - margin.left - margin.right) / (cellSize + 4));

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Heatmap Cells
    const cells = g
      .selectAll('.heat-cell')
      .data(displayRecords)
      .enter()
      .append('rect')
      .attr('class', 'heat-cell cursor-pointer rx-1')
      .attr('x', (d, i) => (i % cols) * (cellSize + 4))
      .attr('y', (d, i) => Math.floor(i / cols) * (cellSize + 4))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 4)
      .attr('fill', d => {
        if (d.status === 'PRESENT') return '#35D07F';
        if (d.status === 'LATE') return '#FFC857';
        return '#FF5577';
      })
      .attr('opacity', 0);

    cells
      .transition()
      .duration(600)
      .delay((d, i) => i * 15)
      .attr('opacity', d => (d.status === 'PRESENT' ? 0.9 : 0.95));

    cells
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('stroke', '#ffffff').attr('stroke-width', 2);
        tooltip.transition().duration(150).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-xs text-slate-300">Date: ${d.date}</div>
            <div class="text-xs font-semibold text-white">Subject: ${d.subject_name || 'Class Session'}</div>
            <div>Status: <span class="font-extrabold" style="color: ${d.status === 'PRESENT' ? '#35D07F' : d.status === 'LATE' ? '#FFC857' : '#FF5577'}">${d.status}</span></div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('stroke', 'none');
        tooltip.transition().duration(150).style('opacity', 0);
      });

  }, [records, width, height]);

  return (
    <div ref={containerRef} className="w-full relative bg-darkCard/40 p-4 rounded-3xl border border-darkBorder">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Attendance Activity Calendar Heatmap
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#35D07F]" /> Present</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FFC857]" /> Late</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FF5577]" /> Absent</span>
        </div>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}
