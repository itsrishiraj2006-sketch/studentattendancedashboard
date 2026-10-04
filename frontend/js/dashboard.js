/* ========================================================
   Dashboard Controller Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let currentTrendPeriod = 'daily';

  // Format Top Navbar Date
  const dateDisplay = document.getElementById('current-date-display');
  if (dateDisplay) {
    const today = new Date('2026-09-01');
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    dateDisplay.querySelector('span').textContent = today.toLocaleDateString('en-US', options);
  }

  // Mobile Sidebar Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Load Subjects for Filter Dropdown
  async function loadSubjectOptions() {
    try {
      const res = await API.getSubjects();
      if (res.success) {
        const select = document.getElementById('filter-subject');
        if (select) {
          select.innerHTML = '<option value="All">All Subjects</option>';
          res.data.forEach(sub => {
            select.innerHTML += `<option value="${sub.id}">${sub.subject_code} - ${sub.subject_name}</option>`;
          });
        }
      }
    } catch (err) {
      console.error('Error loading subject options:', err);
    }
  }

  // Main Dashboard Data Loader & Chart Renderer
  async function updateDashboard() {
    const classVal = document.getElementById('filter-class')?.value || 'All';
    const divisionVal = document.getElementById('filter-division')?.value || 'All';
    const subjectVal = document.getElementById('filter-subject')?.value || 'All';
    const dateVal = document.getElementById('filter-date')?.value || '2026-09-01';
    const statusVal = document.getElementById('filter-status')?.value || 'All';

    const params = {
      class: classVal,
      division: divisionVal,
      subject_id: subjectVal,
      date: dateVal,
      status: statusVal,
      trendPeriod: currentTrendPeriod
    };

    try {
      const res = await API.getDashboardData(params);
      if (res.success) {
        const { kpis, charts } = res.data;

        // 1. Update KPI Cards
        document.getElementById('kpi-total-students').textContent = kpis.totalStudents;
        document.getElementById('kpi-present-today').textContent = kpis.presentToday;
        document.getElementById('kpi-absent-today').textContent = kpis.absentToday;
        document.getElementById('kpi-overall-percentage').textContent = `${kpis.overallAttendancePercentage}%`;

        // 2. Render D3.js Charts
        Charts.renderStudentBarChart('chart-student-attendance', charts.studentAttendance, openStudentProfileModal);
        Charts.renderDonutChart('chart-present-vs-absent', charts.presentVsAbsent);
        Charts.renderSubjectBarChart('chart-subject-attendance', charts.subjectAttendance);
        Charts.renderTrendLineChart('chart-attendance-trend', charts.trendAttendance, currentTrendPeriod);
      }
    } catch (err) {
      console.error('Error updating dashboard data:', err);
    }
  }

  // Open Student Detailed Profile Modal
  async function openStudentProfileModal(studentId) {
    const modal = document.getElementById('student-detail-modal');
    const modalName = document.getElementById('modal-student-name');
    const modalBody = document.getElementById('modal-student-body');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `<div style="text-align:center;padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Loading Student Profile...</p></div>`;
    modal.classList.add('active');

    try {
      const res = await API.getStudentById(studentId);
      if (res.success) {
        const student = res.data;
        modalName.textContent = `${student.name} (${student.roll_no})`;

        let warningBanner = '';
        if (student.lowAttendanceWarning) {
          warningBanner = `
            <div class="alert-warning-banner">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <div>
                <strong>Low Attendance Warning!</strong>
                Student attendance (${student.attendancePercentage}%) is below the mandatory 75% requirement.
              </div>
            </div>
          `;
        }

        modalBody.innerHTML = `
          ${warningBanner}
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:16px;margin-bottom:20px;background:#f8fafc;padding:16px;border-radius:10px;">
            <div><strong>Roll No:</strong> ${student.roll_no}</div>
            <div><strong>Email:</strong> ${student.email}</div>
            <div><strong>Class & Div:</strong> Class ${student.class} - Div ${student.division}</div>
            <div><strong>Department:</strong> ${student.department}</div>
            <div><strong>Total Classes:</strong> ${student.totalClasses}</div>
            <div><strong>Present / Absent:</strong> <span style="color:#10b981;font-weight:600;">${student.presentClasses}</span> / <span style="color:#ef4444;font-weight:600;">${student.absentClasses}</span></div>
            <div style="grid-column:span 2;">
              <strong>Overall Attendance:</strong> 
              <span class="badge ${student.attendancePercentage >= 90 ? 'badge-excellent' : student.attendancePercentage >= 80 ? 'badge-good' : student.attendancePercentage >= 75 ? 'badge-satisfactory' : 'badge-low'}">
                ${student.attendancePercentage}% - ${student.status}
              </span>
            </div>
          </div>

          <h4 style="margin-bottom:12px;font-size:14px;">Subject Breakdown</h4>
          <div style="max-height:180px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;">
            <table style="width:100%;font-size:12px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px 12px;">Subject Code</th>
                  <th style="padding:8px 12px;">Subject Name</th>
                  <th style="padding:8px 12px;">Present / Total</th>
                  <th style="padding:8px 12px;">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                ${student.subjectBreakdown.map(sub => `
                  <tr>
                    <td style="padding:8px 12px;font-weight:600;">${sub.subject_code}</td>
                    <td style="padding:8px 12px;">${sub.subject_name}</td>
                    <td style="padding:8px 12px;">${sub.presentClasses} / ${sub.totalClasses}</td>
                    <td style="padding:8px 12px;font-weight:700;color:${sub.attendancePercentage < 75 ? '#ef4444' : '#10b981'};">${sub.attendancePercentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      modalBody.innerHTML = `<p style="color:#ef4444;">Failed to load profile details.</p>`;
    }
  }

  // Close Modal Listeners
  const closeModalBtn = document.getElementById('btn-close-modal');
  const modalDoneBtn = document.getElementById('btn-modal-done');
  const modalOverlay = document.getElementById('student-detail-modal');

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));

  // Attach Event Listeners to Filter Controls
  ['filter-class', 'filter-division', 'filter-subject', 'filter-date', 'filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateDashboard);
  });

  // Reset Filters Button
  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('filter-class').value = 'All';
      document.getElementById('filter-division').value = 'All';
      document.getElementById('filter-subject').value = 'All';
      document.getElementById('filter-date').value = '2026-09-01';
      document.getElementById('filter-status').value = 'All';
      updateDashboard();
    });
  }

  // Trend Period Toggle Buttons (Daily, Weekly, Monthly)
  document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentTrendPeriod = e.currentTarget.dataset.period;
      updateDashboard();
    });
  });

  // Global Search Input Handler
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length > 1) {
        // Redirection or fast highlight
      }
    });
  }

  // Initial Initialization
  loadSubjectOptions();
  updateDashboard();
});
