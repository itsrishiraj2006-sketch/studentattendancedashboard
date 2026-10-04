import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function AttendanceWaveChart({ data = [], height = 280 }) {
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

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

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

    // Defs & Wave Gradient
    const defs = svg.append('defs');
    const waveGrad = defs
      .append('linearGradient')
      .attr('id', 'wave-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    waveGrad.append('stop').attr('offset', '0%').attr('stop-color', '#35C9FF').attr('stop-opacity', 0.45);
    waveGrad.append('stop').attr('offset', '100%').attr('stop-color', '#35C9FF').attr('stop-opacity', 0.0);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'wave-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gridlines
    g.append('g')
      .attr('class', 'grid opacity-10 stroke-slate-500')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''));

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%d %b')))
      .selectAll('text')
      .attr('class', 'fill-slate-400 font-semibold text-xs');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .attr('class', 'fill-slate-400 font-semibold text-xs');

    // Curved Area Path
    const area = d3
      .area()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(parsedData).attr('fill', 'url(#wave-gradient)').attr('d', area);

    // Curved Line Path
    const line = d3
      .line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#35C9FF')
      .attr('stroke-width', 3)
      .style('filter', 'url(#wave-glow)')
      .attr('d', line);

    // Path animation
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Points
    g.selectAll('.wave-dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'wave-dot cursor-pointer')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.percentage))
      .attr('r', 5)
      .attr('fill', '#35C9FF')
      .attr('stroke', '#111216')
      .attr('stroke-width', 2)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 8).attr('fill', '#FF7A30');
        tooltip.transition().duration(150).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-xs text-slate-300">Date: ${d.rawDate}</div>
            <div class="text-sm font-black text-[#35C9FF]">${d.percentage}% Cumulative Attendance</div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 5).attr('fill', '#35C9FF');
        tooltip.transition().duration(150).style('opacity', 0);
      });

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
}
