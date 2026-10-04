import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function RadialAttendanceVisualization({
  attended = 0,
  missed = 0,
  late = 0,
  percentage = 0,
  status = 'HIGH',
  size = 280
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = size;
    const height = size;
    const radius = Math.min(width, height) / 2;
    const donutWidth = 30;

    const statusConfig = getStatusBadgeConfig(status);

    // Filter data
    const data = [
      { label: 'Attended', value: attended, color: '#35D07F' },
      { label: 'Late', value: late, color: '#FFC857' },
      { label: 'Absent/Missed', value: missed, color: '#FF5577' }
    ].filter(d => d.value > 0);

    if (data.length === 0) {
      data.push({ label: 'No Records', value: 1, color: '#262933' });
    }

    // Glow filter definitions
    const defs = svg.append('defs');
    
    // Radial glow filter
    const filter = defs.append('filter').attr('id', 'hero-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear gradients for slices
    data.forEach((d, i) => {
      const grad = defs.append('linearGradient').attr('id', `hero-grad-${i}`).attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', d.color).attr('stop-opacity', 1);
      grad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(d.color).darker(0.8)).attr('stop-opacity', 0.85);
    });

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Outer subtle guide ring
    g.append('circle')
      .attr('r', radius - 4)
      .attr('fill', 'none')
      .attr('stroke', '#262933')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    // Inner guide ring
    g.append('circle')
      .attr('r', radius - donutWidth - 6)
      .attr('fill', 'none')
      .attr('stroke', '#262933')
      .attr('stroke-width', 1);

    const pie = d3
      .pie()
      .value(d => d.value)
      .padAngle(0.04)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius - donutWidth - 2)
      .outerRadius(radius - 6)
      .cornerRadius(8);

    const hoverArc = d3
      .arc()
      .innerRadius(radius - donutWidth - 4)
      .outerRadius(radius + 2)
      .cornerRadius(8);

    // Tooltip
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
      .attr('fill', (d, i) => `url(#hero-grad-${i})`)
      .style('filter', 'url(#hero-glow)')
      .style('cursor', 'pointer');

    // Entrance Arc Animation
    path
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    // Hover interactions
    path
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', hoverArc);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-sm" style="color: ${d.data.color}">${d.data.label}</div>
            <div class="text-xs text-slate-300">${d.data.value} classes</div>
            <div class="text-[10px] text-slate-400">Total classes: ${attended + missed + late}</div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Center Percentage Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.15em')
      .attr('class', 'fill-white font-extrabold tracking-tight glow-text-orange')
      .style('font-size', `${size / 7.5}px`)
      .text(`${percentage.toFixed(1)}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('class', 'fill-slate-400 font-bold uppercase tracking-widest text-[10px]')
      .text('OVERALL ATTENDANCE');

  }, [attended, missed, late, percentage, status, size]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <svg ref={svgRef} />
    </div>
  );
}
