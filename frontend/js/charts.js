/* ========================================================
   Interactive D3.js v7 Visualization Engine
   Course: Interactive Data Visualization using D3.js (B.Tech 2nd Year)
   ======================================================== */

// Global Tooltip Singleton
let tooltipDiv = d3.select("body").select(".d3-tooltip");
if (tooltipDiv.empty()) {
  tooltipDiv = d3.select("body")
    .append("div")
    .attr("class", "d3-tooltip")
    .style("opacity", 0);
}

const Charts = {
  // ========================================================
  // CHART 1 — Student Attendance Bar Chart (D3.js)
  // Displays student names on X-axis, attendance % on Y-axis (0-100%)
  // Visual threshold: Highlight red for students < 75%
  // ========================================================
  renderStudentBarChart(containerId, data, onClickStudent) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 320;
    const margin = { top: 30, right: 20, bottom: 65, left: 45 };

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;">No student attendance data available</div>`;
      return;
    }

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // X Scale & Axis
    const x = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    // Y Scale & Axis (0 - 100%)
    const y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    // X Axis
    const xAxis = svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-35)")
      .style("font-size", "11px")
      .style("fill", "#64748b");

    // Y Axis
    svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .style("fill", "#64748b");

    // 75% Requirement Threshold Line
    svg.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(75))
      .attr("y2", y(75))
      .attr("stroke", "#ef4444")
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-width", 1.5);

    // Threshold Text Label
    svg.append("text")
      .attr("x", width - margin.right)
      .attr("y", y(75) - 6)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#ef4444")
      .style("font-weight", "600")
      .text("Required 75%");

    // Animated Bar Join Pattern
    svg.selectAll(".bar")
      .data(data, d => d.student_id)
      .join("rect")
      .attr("class", "bar bar-hover")
      .attr("x", d => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", height - margin.bottom)
      .attr("height", 0)
      .attr("rx", 4)
      .attr("fill", d => d.attendancePercentage < 75 ? "#ef4444" : "#3b82f6")
      .on("mouseover", (event, d) => {
        tooltipDiv.transition().duration(150).style("opacity", 1);
        tooltipDiv.html(`
          <strong>${d.name} (${d.roll_no})</strong>
          Class: ${d.class} | Div: ${d.division}<br/>
          Attendance: <b>${d.attendancePercentage}%</b><br/>
          Status: <span style="color:${d.attendancePercentage < 75 ? '#ef4444' : '#10b981'}">${d.attendancePercentage < 75 ? 'Low Attendance (<75%)' : 'Satisfactory'}</span>
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltipDiv.transition().duration(200).style("opacity", 0);
      })
      .on("click", (event, d) => {
        if (typeof onClickStudent === 'function') onClickStudent(d.student_id);
      })
      .transition()
      .duration(800)
      .attr("y", d => y(d.attendancePercentage))
      .attr("height", d => height - margin.bottom - y(d.attendancePercentage));
  },

  // ========================================================
  // CHART 2 — Present vs Absent Donut Chart (D3.js)
  // Demonstrates d3.pie() and d3.arc()
  // ========================================================
  renderDonutChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;
    const radius = Math.min(width, height) / 2 - 30;

    if (!data || data.length === 0 || (data[0].count === 0 && data[1].count === 0)) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;">No attendance data for Donut Chart</div>`;
      return;
    }

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2 - 40}, ${height / 2})`);

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.58)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(radius * 0.55)
      .outerRadius(radius * 1.05);

    const color = d3.scaleOrdinal()
      .domain(['Present', 'Absent'])
      .range(['#10b981', '#ef4444']);

    // Slices Join
    const path = svg.selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("fill", d => color(d.data.label))
      .attr("d", arc)
      .style("cursor", "pointer")
      .each(function(d) { this._current = d; });

    // Transitions
    path.transition()
      .duration(750)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) { return arc(interpolate(t)); };
      });

    // Hover Events
    path.on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", arcHover);
      tooltipDiv.transition().duration(150).style("opacity", 1);
      tooltipDiv.html(`
        <strong>${d.data.label}</strong>
        Count: <b>${d.data.count}</b><br/>
        Share: <b>${d.data.percentage}%</b>
      `)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", (event) => {
      tooltipDiv
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).transition().duration(200).attr("d", arc);
      tooltipDiv.transition().duration(200).style("opacity", 0);
    });

    // Center Summary Text
    const totalCount = d3.sum(data, d => d.count);
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .style("font-size", "22px")
      .style("font-weight", "800")
      .style("fill", "#0f172a")
      .text(totalCount);

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "11px")
      .style("fill", "#64748b")
      .style("text-transform", "uppercase")
      .text("Total Records");

    // Donut Legend
    const legendG = d3.select(`#${containerId} svg`)
      .append("g")
      .attr("transform", `translate(${width - 110}, ${height / 2 - 30})`);

    data.forEach((d, i) => {
      const row = legendG.append("g").attr("transform", `translate(0, ${i * 28})`);
      row.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 3)
        .attr("fill", d.color);

      row.append("text")
        .attr("x", 22)
        .attr("y", 11)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#1e293b")
        .text(`${d.label} (${d.percentage}%)`);
    });
  },

  // ========================================================
  // CHART 3 — Subject-wise Attendance Bar Chart (D3.js)
  // Compares attendance percentage across subjects
  // ========================================================
  renderSubjectBarChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 320;
    const margin = { top: 30, right: 30, bottom: 65, left: 50 };

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;">No subject data available</div>`;
      return;
    }

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .domain(data.map(d => d.subject_code))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    // X Axis
    const xAxis = svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)")
      .style("font-size", "11px")
      .style("fill", "#64748b");

    // Y Axis
    svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Gradient Fill for Subject Bars
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "subject-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6");

    // Render Bars
    svg.selectAll(".subject-bar")
      .data(data)
      .join("rect")
      .attr("class", "subject-bar bar-hover")
      .attr("x", d => x(d.subject_code))
      .attr("width", x.bandwidth())
      .attr("y", height - margin.bottom)
      .attr("height", 0)
      .attr("rx", 5)
      .attr("fill", "url(#subject-gradient)")
      .on("mouseover", (event, d) => {
        tooltipDiv.transition().duration(150).style("opacity", 1);
        tooltipDiv.html(`
          <strong>${d.subject_name} (${d.subject_code})</strong>
          Faculty: ${d.faculty_name}<br/>
          Total Classes: ${d.totalClasses}<br/>
          Attendance Rate: <b>${d.attendancePercentage}%</b>
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltipDiv.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(800)
      .attr("y", d => y(d.attendancePercentage))
      .attr("height", d => height - margin.bottom - y(d.attendancePercentage));
  },

  // ========================================================
  // CHART 4 — Attendance Trend Line Chart (D3.js)
  // Smooth curve line chart over Daily / Weekly / Monthly timeline
  // ========================================================
  renderTrendLineChart(containerId, data, period = 'daily') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 320;
    const margin = { top: 30, right: 30, bottom: 50, left: 45 };

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;">No trend data available</div>`;
      return;
    }

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    // X Axis
    const xAxis = svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)")
      .style("font-size", "10px")
      .style("fill", "#64748b");

    // Y Axis
    svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Area Generator under Line
    const area = d3.area()
      .x(d => x(d.date))
      .y0(height - margin.bottom)
      .y1(d => y(d.percentage))
      .curve(d3.curveMonotoneX);

    const areaGradient = svg.append("defs").append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");

    areaGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(59, 130, 246, 0.35)");
    areaGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(59, 130, 246, 0.0)");

    svg.append("path")
      .datum(data)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area);

    // Smooth Line Generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.percentage))
      .curve(d3.curveMonotoneX);

    const path = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Line Path Animation
    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1000)
      .attr("stroke-dashoffset", 0);

    // Data Points
    svg.selectAll(".trend-dot")
      .data(data)
      .join("circle")
      .attr("class", "trend-dot")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.percentage))
      .attr("r", 4)
      .attr("fill", "#ffffff")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("r", 7).attr("fill", "#3b82f6");
        tooltipDiv.transition().duration(150).style("opacity", 1);
        tooltipDiv.html(`
          <strong>Timeline: ${d.date}</strong>
          Present: ${d.presentCount} / ${d.totalCount}<br/>
          Attendance Rate: <b>${d.percentage}%</b>
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("r", 4).attr("fill", "#ffffff");
        tooltipDiv.transition().duration(200).style("opacity", 0);
      });
  },

  // ========================================================
  // CHART 5 — Distribution Histogram / Grouped Bar Chart (Analytics)
  // Groups students into 90-100%, 80-89%, 75-79%, Below 75%
  // ========================================================
  renderDistributionChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 45 };

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;">No distribution data available</div>`;
      return;
    }

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .domain(data.map(d => d.range))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const maxCount = d3.max(data, d => d.count) || 10;

    const y = d3.scaleLinear()
      .domain([0, maxCount + 2])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.append("g")
      .attr("class", "grid-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    // X Axis
    svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    // Y Axis
    svg.append("g")
      .attr("class", "axis-line")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5));

    const colorScale = {
      '90-100%': '#10b981',
      '80-89%': '#3b82f6',
      '75-79%': '#f59e0b',
      'Below 75%': '#ef4444'
    };

    svg.selectAll(".dist-bar")
      .data(data)
      .join("rect")
      .attr("class", "dist-bar bar-hover")
      .attr("x", d => x(d.range))
      .attr("width", x.bandwidth())
      .attr("y", height - margin.bottom)
      .attr("height", 0)
      .attr("rx", 5)
      .attr("fill", d => colorScale[d.range] || '#3b82f6')
      .on("mouseover", (event, d) => {
        tooltipDiv.transition().duration(150).style("opacity", 1);
        tooltipDiv.html(`
          <strong>Range: ${d.range}</strong>
          Student Count: <b>${d.count}</b><br/>
          Percentage of Cohort: <b>${d.percentage}%</b>
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltipDiv.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(800)
      .attr("y", d => y(d.count))
      .attr("height", d => height - margin.bottom - y(d.count));
  }
};

window.Charts = Charts;
