/* ========================================================
   Advanced Analytics Controller Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Load Subject Options
  async function loadSubjectDropdown() {
    try {
      const res = await API.getSubjects();
      if (res.success) {
        const select = document.getElementById('analytics-filter-subject');
        if (select) {
          select.innerHTML = '<option value="All">All Subjects</option>';
          res.data.forEach(sub => {
            select.innerHTML += `<option value="${sub.id}">${sub.subject_code} - ${sub.subject_name}</option>`;
          });
        }
      }
    } catch (err) {
      console.error('Error loading subject dropdown:', err);
    }
  }

  // Load Analytics Data & Render D3 Visualizations
  async function updateAnalytics() {
    const classVal = document.getElementById('analytics-filter-class')?.value || 'All';
    const divisionVal = document.getElementById('analytics-filter-division')?.value || 'All';
    const subjectVal = document.getElementById('analytics-filter-subject')?.value || 'All';

    try {
      const res = await API.getAnalyticsData({ class: classVal, division: divisionVal, subject_id: subjectVal });
      if (res.success) {
        const { distribution, topStudents, lowAttendanceStudents, subjectComparison, trends } = res.data;

        // 1. Render Distribution D3 Histogram
        Charts.renderDistributionChart('chart-analytics-distribution', distribution);

        // 2. Render Subject Comparison D3 Bar Chart
        Charts.renderSubjectBarChart('chart-analytics-subjects', subjectComparison);

        // 3. Render Top 5 Performers Leaderboard
        renderTopPerformers(topStudents);

        // 4. Render Trend Timeline D3 Curve Chart
        Charts.renderTrendLineChart('chart-analytics-trend', trends, 'daily');

        // 5. Render Low Attendance Warning Table
        renderLowAttendanceTable(lowAttendanceStudents);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }

  // Render Top 5 Leaderboard UI
  function renderTopPerformers(topStudents) {
    const container = document.getElementById('top-performers-list');
    if (!container) return;

    if (!topStudents || topStudents.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;">No student data available</div>`;
      return;
    }

    const rankIcons = [
      '<i class="fa-solid fa-medal" style="color:#eab308;font-size:18px;"></i>',
      '<i class="fa-solid fa-medal" style="color:#94a3b8;font-size:18px;"></i>',
      '<i class="fa-solid fa-medal" style="color:#b45309;font-size:18px;"></i>',
      '<span style="font-weight:700;color:#64748b;">4.</span>',
      '<span style="font-weight:700;color:#64748b;">5.</span>'
    ];

    container.innerHTML = topStudents.map((s, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:${idx === 0 ? '#fefce8' : '#fff'};border-radius:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:24px;text-align:center;">${rankIcons[idx]}</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#0f172a;">${s.name}</div>
            <div style="font-size:11px;color:#64748b;">${s.roll_no} | Class ${s.class}-${s.division}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:16px;font-weight:800;color:#10b981;">${s.attendancePercentage}%</span>
          <div style="font-size:11px;color:#64748b;">${s.presentClasses}/${s.totalClasses} classes</div>
        </div>
      </div>
    `).join('');
  }

  // Render Low Attendance Table UI
  function renderLowAttendanceTable(students) {
    const tbody = document.getElementById('low-attendance-table-body');
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#10b981;font-weight:600;"><i class="fa-solid fa-circle-check"></i> Great news! All students currently meet or exceed the mandatory 75% attendance threshold.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      // Calculate how many more present classes needed to reach 75%
      const targetRatio = 0.75;
      const deficit = Math.max(1, Math.ceil((targetRatio * s.totalClasses - s.presentClasses) / (1 - targetRatio)));

      return `
        <tr>
          <td style="font-weight:600;color:var(--primary);">${s.roll_no}</td>
          <td style="font-weight:700;color:#0f172a;">${s.name}</td>
          <td>${s.email}</td>
          <td>${s.class} - ${s.division}</td>
          <td>${s.presentClasses} / ${s.totalClasses}</td>
          <td style="font-weight:800;color:#ef4444;">${s.attendancePercentage}%</td>
          <td><span style="font-size:11px;font-weight:600;color:#b91c1c;background:#fee2e2;padding:3px 8px;border-radius:12px;">Needs +${deficit} classes</span></td>
          <td style="text-align:right;">
            <a href="mailto:${s.email}?subject=Attendance%20Warning%20Notice&body=Dear%20${encodeURIComponent(s.name)},%20Your%20current%20attendance%20is%20${s.attendancePercentage}%,%20which%20is%20below%20the%20required%2075%.%20Please%20contact%20the%20CSE%20department." class="btn btn-danger btn-sm" style="text-decoration:none;">
              <i class="fa-solid fa-envelope"></i> Send Warning
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Attach filter change listeners
  ['analytics-filter-class', 'analytics-filter-division', 'analytics-filter-subject'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updateAnalytics);
  });

  // Initial Initialization
  loadSubjectDropdown();
  updateAnalytics();
});
