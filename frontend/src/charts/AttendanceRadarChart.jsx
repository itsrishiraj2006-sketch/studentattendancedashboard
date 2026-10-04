import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function AttendanceRadarChart({ data = [], height = 300 }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(400);

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
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 45;
    const radius = Math.min(width, height) / 2 - margin;
    if (radius <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const axes = data.map(d => ({
      name: d.code || d.name,
      fullName: d.name,
      value: d.percentage || 0,
      attended: d.attended || d.attended_classes || 0,
      total: d.totalClasses || d.total_classes || 0,
      status: d.status || 'HIGH'
    }));

    const totalAxes = axes.length;
    const angleSlice = (Math.PI * 2) / totalAxes;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric Web Circles (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      g.append('circle')
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', '#262933')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      g.append('text')
        .attr('x', 5)
        .attr('y', -levelRadius + 3)
        .attr('class', 'fill-slate-500 text-[9px] font-semibold')
        .text(`${i * 20}%`);
    }

    // Axis Lines & Text Labels
    const axisG = g.selectAll('.axis').data(axes).enter().append('g').attr('class', 'axis');

    axisG
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#262933')
      .attr('stroke-width', 1.5);

    axisG
      .append('text')
      .attr('class', 'fill-slate-300 font-extrabold text-[10px]')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (d, i) => (rScale(100) + 18) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (rScale(100) + 18) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d.name);

    // Defs & Polygon Gradient
    const defs = svg.append('defs');
    const grad = defs
      .append('radialGradient')
      .attr('id', 'radar-grad')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    grad.append('stop').attr('offset', '0%').attr('stop-color', '#FF7A30').attr('stop-opacity', 0.6);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#9B6CFF').attr('stop-opacity', 0.2);

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Polygon coordinates generator
    const radarLine = d3
      .lineRadial()
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Draw Radar Polygon Area
    const radarPolygon = g
      .append('path')
      .datum(axes)
      .attr('d', radarLine)
      .attr('fill', 'url(#radar-grad)')
      .attr('stroke', '#FF7A30')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0 0 8px rgba(255, 122, 48, 0.4))');

    // Radar Vertices Points
    g.selectAll('.radar-dot')
      .data(axes)
      .enter()
      .append('circle')
      .attr('class', 'radar-dot cursor-pointer')
      .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 5)
      .attr('fill', d => getStatusBadgeConfig(d.status).color)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 8);
        tooltip.transition().duration(150).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-xs text-[#FF7A30]">${d.fullName} (${d.name})</div>
            <div class="text-xs font-extrabold text-[#35D07F]">Attendance: ${d.value}%</div>
            <div class="text-[10px] text-slate-300">Attended: ${d.attended} / Total: ${d.total}</div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 5);
        tooltip.transition().duration(150).style('opacity', 0);
      });

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="w-full relative flex flex-col items-center justify-center">
      <svg ref={svgRef} />
    </div>
  );
}
