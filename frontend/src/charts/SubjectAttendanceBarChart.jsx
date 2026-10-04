import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function SubjectAttendanceBarChart({ data = [], height = 300 }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(500);

  // ResizeObserver for dynamic responsive width
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
    svg.selectAll('*').remove(); // Clear previous rendering

    const margin = { top: 30, right: 20, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X Scale: Subject Code or Name
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.code || d.name))
      .range([0, innerWidth])
      .padding(0.35);

    // Y Scale: Percentage 0 - 100%
    const yScale = d3.scaleLinear().domain([0, 100]).nice().range([innerHeight, 0]);

    // Gridlines
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('');
    g.append('g')
      .attr('class', 'grid opacity-15 stroke-slate-400')
      .call(yGrid);

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'fill-slate-600 dark:fill-slate-300 font-medium text-xs')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('class', 'fill-slate-600 dark:fill-slate-300 font-medium text-xs');

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // High Threshold Line (75%)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(75))
      .attr('y2', yScale(75))
      .attr('stroke', '#10b981')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.5)
      .style('opacity', 0.7);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(75) - 6)
      .attr('text-anchor', 'end')
      .attr('class', 'fill-emerald-600 font-semibold text-[10px]')
      .text('Target (75%)');

    // Bars
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar cursor-pointer rx-1')
      .attr('x', d => xScale(d.code || d.name))
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', d => getStatusBadgeConfig(d.status).color);

    // Animation transition
    bars
      .transition()
      .duration(800)
      .delay((d, i) => i * 80)
      .attr('y', d => yScale(d.percentage))
      .attr('height', d => innerHeight - yScale(d.percentage));

    // Hover tooltips
    bars
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 0.85);
        tooltip.transition().duration(150).style('opacity', 0.95);
        tooltip
          .html(`
            <div class="font-bold text-sm mb-1">${d.name} (${d.code})</div>
            <div>Attendance: <span class="font-semibold text-emerald-300">${d.percentage}%</span></div>
            <div>Attended: ${d.attended || 0} / Total: ${d.totalClasses || 0}</div>
            <div>Status: ${d.status}</div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
        tooltip.transition().duration(150).style('opacity', 0);
      });

    // Bar Percentage Value Labels
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'fill-slate-700 dark:fill-slate-200 font-semibold text-[11px]')
      .attr('text-anchor', 'middle')
      .attr('x', d => xScale(d.code || d.name) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .text(d => `${d.percentage}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 80)
      .attr('y', d => Math.max(yScale(d.percentage) - 6, 12));

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
}
