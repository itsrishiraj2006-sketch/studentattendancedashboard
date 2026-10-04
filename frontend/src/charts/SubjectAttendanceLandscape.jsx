import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getStatusBadgeConfig } from '../utils/attendanceUtils';

export default function SubjectAttendanceLandscape({ subjects = [], height = 340 }) {
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
    if (!svgRef.current || !subjects || subjects.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width;
    const innerHeight = height;

    svg.attr('width', innerWidth).attr('height', innerHeight);

    // Build node and link network dataset
    const nodes = subjects.map((sub, i) => ({
      id: sub.id || i,
      name: sub.name,
      code: sub.code,
      percentage: sub.percentage || 0,
      totalClasses: sub.total_classes || sub.totalClasses || 30,
      attended: sub.attended_classes || sub.attended || 0,
      missed: sub.missed_classes || sub.missed || 0,
      status: sub.status || 'HIGH'
    }));

    // Create interconnected links between adjacent subject nodes
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (i % 2 === j % 2 || (i + j) % 3 === 0) {
          links.push({ source: nodes[i].id, target: nodes[j].id });
        }
      }
    }

    const defs = svg.append('defs');
    
    // Glow filter
    const filter = defs.append('filter').attr('id', 'landscape-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Tooltip
    let tooltip = d3.select('body').select('.chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip').style('opacity', 0);
    }

    // Force Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collide', d3.forceCollide().radius(45));

    // Links lines
    const linkPath = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#262933')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3');

    // Node groups
    const nodeGroup = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node Outer Ring
    nodeGroup
      .append('circle')
      .attr('r', d => Math.max(24, Math.min(38, 18 + d.totalClasses * 0.5)))
      .attr('fill', '#191B21')
      .attr('stroke', d => getStatusBadgeConfig(d.status).color)
      .attr('stroke-width', 2.5)
      .style('filter', 'url(#landscape-glow)');

    // Node Inner Pulsing Dot
    nodeGroup
      .append('circle')
      .attr('r', 6)
      .attr('fill', d => getStatusBadgeConfig(d.status).color);

    // Subject Code Label
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.8em')
      .attr('class', 'fill-white font-bold text-[11px]')
      .text(d => d.code);

    // Percentage Label
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-1.5em')
      .attr('class', 'fill-[#FF7A30] font-extrabold text-[10px]')
      .text(d => `${d.percentage}%`);

    // Hover tooltip
    nodeGroup
      .on('mouseover', function (event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', 42);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(`
            <div class="font-bold text-sm text-[#FF7A30] mb-1">${d.name} (${d.code})</div>
            <div>Attendance: <span class="font-extrabold text-[#35D07F]">${d.percentage}%</span></div>
            <div>Attended: ${d.attended} / Total: ${d.totalClasses}</div>
            <div>Status: <span style="color:${getStatusBadgeConfig(d.status).color}">${d.status}</span></div>
          `)
          .style('left', event.pageX + 12 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 12 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').transition().duration(200).attr('r', d => Math.max(24, Math.min(38, 18 + d.totalClasses * 0.5)));
        tooltip.transition().duration(200).style('opacity', 0);
      });

    simulation.on('tick', () => {
      linkPath
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeGroup.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    return () => simulation.stop();

  }, [subjects, width, height]);

  return (
    <div ref={containerRef} className="w-full relative bg-darkCard/50 rounded-3xl border border-darkBorder p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF7A30] animate-pulse" />
          Subject Attendance Landscape (Network Visualization)
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">Node Size = Total Classes | Drag Nodes</span>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}
