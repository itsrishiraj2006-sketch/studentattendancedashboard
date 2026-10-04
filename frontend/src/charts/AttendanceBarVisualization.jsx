import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function AttendanceBarVisualization({ data = [], height = 300 }) {
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
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const defs = svg.append('defs');
    
    // Bar Glow Filter
    const filter = defs.append('filter').attr('id', 'bar-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Bar Gradients per status
    data.forEach((d, i) => {
      const grad = defs.append('linearGradient').attr('id', `bar-grad-${i}`).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      const statusColor = getStatusBadgeConfig(d.status).color;
      grad.append('stop').attr('offset', '0%').attr('stop-color', statusColor).attr('stop-opacity', 1);
      grad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(statusColor).darker(1.2)).attr('stop-opacity', 0.75);
    });

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.code || d.name))
      .range([0, innerWidth])
      .padding(0.4);

    const yScale = d3.scaleLinear().domain([0, 100]).nice().range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid opacity-10 stroke-slate-500')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''));

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('class', 'fill-slate-300 font-bold text-xs')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .attr('class', 'fill-slate-400 font-medium text-xs');

    // Target Threshold Line (75%)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(75))
      .attr('y2', yScale(75))
      .attr('stroke', '#35D07F')
      .attr('stroke-dasharray', '5 5')
      .attr('stroke-width', 1.5)
      .style('opacity', 0.6);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(75) - 6)
      .attr('text-anchor', 'end')
      .attr('class', 'fill-[#35D07F] font-bold text-[10px]')
      .text('High Threshold (75%)');

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Bars
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar cursor-pointer')
      .attr('x', d => xScale(d.code || d.name))
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('fill', (d, i) => `url(#bar-grad-${i})`)
      .style('filter', 'url(#bar-glow)');

    // Animated Bar Growth
    bars
      .transition()
      .duration(900)
      .delay((d, i) => i * 80)
      .ease(d3.easeCubicOut)
      .attr('y', d => yScale(d.percentage))
      .attr('height', d => innerHeight - yScale(d.percentage));

    // Hover Tooltips
    bars
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).style('opacity', 0.85);
        tooltip.transition().duration(150).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-sm text-[#FF7A30]">${d.name} (${d.code})</div>
            <div>Attendance: <span class="font-extrabold text-[#35D07F]">${d.percentage}%</span></div>
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
        d3.select(this).transition().duration(150).style('opacity', 1);
        tooltip.transition().duration(150).style('opacity', 0);
      });

    // Bar Value Labels
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'fill-white font-extrabold text-[11px]')
      .attr('text-anchor', 'middle')
      .attr('x', d => xScale(d.code || d.name) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .text(d => `${d.percentage}%`)
      .transition()
      .duration(900)
      .delay((d, i) => i * 80)
      .attr('y', d => Math.max(yScale(d.percentage) - 8, 12));

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
}
