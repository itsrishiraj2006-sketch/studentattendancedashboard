import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function AttendanceCategoryChart({ categoryCounts = { HIGH: 0, AVERAGE: 0, LOW: 0 }, height = 220 }) {
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
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const data = [
      { category: 'High (>=75%)', count: categoryCounts.HIGH || 0, color: '#10b981', key: 'HIGH' },
      { category: 'Average (60-75%)', count: categoryCounts.AVERAGE || 0, color: '#f59e0b', key: 'AVERAGE' },
      { category: 'Low (<60%)', count: categoryCounts.LOW || 0, color: '#ef4444', key: 'LOW' }
    ];

    const margin = { top: 20, right: 30, bottom: 40, left: 110 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxCount = Math.max(1, d3.max(data, d => d.count));

    const yScale = d3
      .scaleBand()
      .domain(data.map(d => d.category))
      .range([0, innerHeight])
      .padding(0.3);

    const xScale = d3.scaleLinear().domain([0, maxCount]).nice().range([0, innerWidth]);

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('class', 'fill-slate-700 dark:fill-slate-200 font-medium text-xs');

    // Horizontal Bars
    const bars = g
      .selectAll('.cat-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cat-bar rx-1')
      .attr('y', d => yScale(d.category))
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('rx', 4)
      .attr('fill', d => d.color);

    bars
      .transition()
      .duration(750)
      .attr('width', d => xScale(d.count));

    // Value Labels
    g.selectAll('.cat-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'fill-slate-700 dark:fill-slate-200 font-bold text-xs')
      .attr('y', d => yScale(d.category) + yScale.bandwidth() / 2 + 4)
      .attr('x', 0)
      .text(d => `${d.count} subject${d.count === 1 ? '' : 's'}`)
      .transition()
      .duration(750)
      .attr('x', d => Math.max(xScale(d.count) + 8, 10));

  }, [categoryCounts, width, height]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
}
