/* ========================================================
   Attendance Reports Controller Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let currentReportData = [];

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Load and Render Selected Report
  async function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const classVal = document.getElementById('report-class').value;
    const divisionVal = document.getElementById('report-division').value;

    const titleHeading = document.getElementById('report-title-heading');
    const timestampLabel = document.getElementById('report-generated-timestamp');

    const now = new Date();
    if (timestampLabel) {
      timestampLabel.textContent = `Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    }

    try {
      if (reportType === 'student') {
        titleHeading.textContent = 'Student Cumulative Attendance Report';
        const res = await API.getStudents({ class: classVal, division: divisionVal });
        if (res.success) {
          currentReportData = res.data;
          renderStudentReportTable(res.data);
        }
      } else if (reportType === 'subject') {
        titleHeading.textContent = 'Subject-wise Performance Report';
        const res = await API.getAnalyticsData({ class: classVal, division: divisionVal });
        if (res.success) {
          currentReportData = res.data.subjectComparison;
          renderSubjectReportTable(res.data.subjectComparison);
        }
      } else if (reportType === 'class') {
        titleHeading.textContent = 'Class & Division Summary Report';
        const res = await API.getStudents({ class: classVal, division: divisionVal });
        if (res.success) {
          currentReportData = res.data;
          renderClassReportTable(res.data);
        }
      } else if (reportType === 'date') {
        titleHeading.textContent = 'Daily Log Attendance Report';
        const res = await API.getAttendance({ class: classVal, division: divisionVal });
        if (res.success) {
          currentReportData = res.data;
          renderDateReportTable(res.data);
        }
      }
    } catch (err) {
      console.error('Error generating report:', err);
    }
  }

  // Render 1: Student Cumulative Report Table
  function renderStudentReportTable(data) {
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');

    thead.innerHTML = `
      <tr>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Class & Div</th>
        <th>Total Classes</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Attendance %</th>
        <th>Academic Status</th>
      </tr>
    `;

    tbody.innerHTML = data.map(s => `
      <tr>
        <td style="font-weight:600;color:var(--primary);">${s.roll_no}</td>
        <td style="font-weight:600;">${s.name}</td>
        <td>${s.class} - ${s.division}</td>
        <td>${s.totalClasses}</td>
        <td style="color:#10b981;font-weight:600;">${s.presentClasses}</td>
        <td style="color:#ef4444;font-weight:600;">${s.absentClasses}</td>
        <td style="font-weight:700;color:${s.attendancePercentage < 75 ? '#ef4444' : '#10b981'};">${s.attendancePercentage}%</td>
        <td>
          <span class="badge ${s.attendancePercentage >= 90 ? 'badge-excellent' : s.attendancePercentage >= 80 ? 'badge-good' : s.attendancePercentage >= 75 ? 'badge-satisfactory' : 'badge-low'}">
            ${s.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Render 2: Subject Report Table
  function renderSubjectReportTable(data) {
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');

    thead.innerHTML = `
      <tr>
        <th>Subject Code</th>
        <th>Subject Name</th>
        <th>Faculty Instructor</th>
        <th>Total Classes Held</th>
        <th>Total Present</th>
        <th>Total Absent</th>
        <th>Overall Rate %</th>
      </tr>
    `;

    tbody.innerHTML = data.map(sub => `
      <tr>
        <td style="font-weight:600;color:var(--primary);">${sub.subject_code}</td>
        <td style="font-weight:600;">${sub.subject_name}</td>
        <td>${sub.faculty_name}</td>
        <td>${sub.totalClasses}</td>
        <td style="color:#10b981;font-weight:600;">${sub.presentClasses}</td>
        <td style="color:#ef4444;font-weight:600;">${sub.absentClasses}</td>
        <td style="font-weight:700;color:${sub.attendancePercentage < 75 ? '#ef4444' : '#10b981'};">${sub.attendancePercentage}%</td>
      </tr>
    `).join('');
  }

  // Render 3: Class & Division Report Table
  function renderClassReportTable(data) {
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');

    thead.innerHTML = `
      <tr>
        <th>Class</th>
        <th>Division</th>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Department</th>
        <th>Attendance %</th>
        <th>Eligibility Status</th>
      </tr>
    `;

    tbody.innerHTML = data.map(s => `
      <tr>
        <td style="font-weight:600;">Class ${s.class}</td>
        <td>Division ${s.division}</td>
        <td style="font-weight:600;color:var(--primary);">${s.roll_no}</td>
        <td>${s.name}</td>
        <td>${s.department}</td>
        <td style="font-weight:700;color:${s.attendancePercentage < 75 ? '#ef4444' : '#10b981'};">${s.attendancePercentage}%</td>
        <td>
          <span style="font-size:11px;font-weight:700;color:${s.attendancePercentage >= 75 ? '#047857' : '#b91c1c'};background:${s.attendancePercentage >= 75 ? '#d1fae5' : '#fee2e2'};padding:4px 8px;border-radius:12px;">
            ${s.attendancePercentage >= 75 ? 'ELIGIBLE' : 'DEBARRED (<75%)'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Render 4: Daily Log Attendance Report Table
  function renderDateReportTable(data) {
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');

    thead.innerHTML = `
      <tr>
        <th>Date</th>
        <th>Roll Number</th>
        <th>Student Name</th>
        <th>Class & Div</th>
        <th>Subject</th>
        <th>Status Log</th>
      </tr>
    `;

    tbody.innerHTML = data.slice(0, 150).map(rec => `
      <tr>
        <td>${rec.attendance_date ? rec.attendance_date.toString().substring(0, 10) : ''}</td>
        <td style="font-weight:600;">${rec.roll_no}</td>
        <td>${rec.student_name}</td>
        <td>${rec.class} - ${rec.division}</td>
        <td>${rec.subject_code} - ${rec.subject_name}</td>
        <td>
          <span style="font-size:11px;font-weight:700;color:${rec.status === 'Present' ? '#047857' : '#b91c1c'};">
            ${rec.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Export CSV Handler
  const exportCsvBtn = document.getElementById('btn-export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const table = document.getElementById('report-table');
      if (!table) return;

      const rows = [];
      const trs = table.querySelectorAll('tr');

      trs.forEach(tr => {
        const row = [];
        tr.querySelectorAll('th, td').forEach(td => {
          let text = td.innerText.replace(/"/g, '""').trim();
          row.push(`"${text}"`);
        });
        rows.push(row.join(','));
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const reportType = document.getElementById('report-type').value;
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Attendance_Report_${reportType}_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Print Report Handler
  const printReportBtn = document.getElementById('btn-print-report');
  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => window.print());
  }

  // Attach Filter Change Listeners
  ['report-type', 'report-class', 'report-division'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', generateReport);
  });

  // Initial Load
  generateReport();
});
