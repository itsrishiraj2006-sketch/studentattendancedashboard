import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function AttendanceTimelineChart({ data = [], height = 280 }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(500);

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

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Parse dates
    const parsedData = data.map(d => ({
      date: new Date(d.date),
      rawDate: d.date,
      percentage: parseFloat(d.percentage) || 0
    }));

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).nice().range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid opacity-15 stroke-slate-400')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''));

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%d %b'));
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'fill-slate-600 dark:fill-slate-300 text-xs');

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('class', 'fill-slate-600 dark:fill-slate-300 text-xs');

    // Gradient fill
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'timeline-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#2563eb').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb').attr('stop-opacity', 0.0);

    // Area path
    const area = d3
      .area()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(parsedData).attr('fill', 'url(#timeline-gradient)').attr('d', area);

    // Line path generator
    const line = d3
      .line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line path drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Circles for data points
    g.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot cursor-pointer')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.percentage))
      .attr('r', 4)
      .attr('fill', '#2563eb')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 7).attr('fill', '#1d4ed8');
        tooltip.transition().duration(150).style('opacity', 0.95);
        tooltip
          .html(`
            <div class="font-semibold text-xs text-slate-300">${d.rawDate}</div>
            <div class="text-sm font-bold text-emerald-300">${d.percentage}% Attendance</div>
          `)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 4).attr('fill', '#2563eb');
        tooltip.transition().duration(150).style('opacity', 0);
      });

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
}
