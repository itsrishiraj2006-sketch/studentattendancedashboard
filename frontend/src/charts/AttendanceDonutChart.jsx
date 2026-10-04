import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function AttendanceDonutChart({
  attended = 0,
  missed = 0,
  late = 0,
  percentage = 0,
  status = 'HIGH',
  title = '',
  size = 200,
  donutWidth = 24
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear prior elements for clean redraw

    const width = size;
    const height = size;
    const radius = Math.min(width, height) / 2;

    const statusConfig = getStatusBadgeConfig(status);

    const data = [
      { label: 'Attended', value: attended, color: statusConfig.color },
      { label: 'Late', value: late, color: '#f59e0b' },
      { label: 'Absent/Missed', value: missed, color: '#ef4444' }
    ].filter(d => d.value > 0);

    // If no data, show empty placeholder ring
    if (data.length === 0) {
      data.push({ label: 'No Records', value: 1, color: '#e2e8f0' });
    }

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius - donutWidth)
      .outerRadius(radius);

    const hoverArc = d3
      .arc()
      .innerRadius(radius - donutWidth - 2)
      .outerRadius(radius + 4);

    // Create Tooltip DIV if not exists
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Draw slices
    const path = g
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer');

    // Transitions and interactive hover
    path
      .transition()
      .duration(750)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    path
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', hoverArc);
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip
          .html(`<strong>${d.data.label}</strong>: ${d.data.value} classes`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Center Percentage Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('class', 'text-2xl font-bold fill-slate-800 dark:fill-slate-100')
      .style('font-size', `${Math.max(16, size / 10)}px`)
      .style('font-weight', '700')
      .text(`${percentage.toFixed(1)}%`);

    if (title) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.4em')
        .attr('class', 'text-xs fill-slate-500 dark:fill-slate-400')
        .style('font-size', `${Math.max(10, size / 18)}px`)
        .text(title);
    }
  }, [attended, missed, late, percentage, status, size, donutWidth, title]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center relative">
      <svg ref={svgRef} />
    </div>
  );
}
