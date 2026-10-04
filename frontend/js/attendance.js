/* ========================================================
   Attendance Marking Controller Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let rosterStudents = [];
  let markingState = {}; // student_id -> 'Present' | 'Absent'

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Load Subjects dropdown
  async function loadSubjectDropdown() {
    try {
      const res = await API.getSubjects();
      if (res.success && res.data.length > 0) {
        const select = document.getElementById('att-subject');
        if (select) {
          select.innerHTML = res.data.map(sub => 
            `<option value="${sub.id}">${sub.subject_code} - ${sub.subject_name}</option>`
          ).join('');
        }
        loadRoster();
      }
    } catch (err) {
      console.error('Error loading subject dropdown:', err);
    }
  }

  // Load Roster & Existing Attendance State
  async function loadRoster() {
    const dateVal = document.getElementById('att-date')?.value || '2026-09-01';
    const classVal = document.getElementById('att-class')?.value || '2A';
    const divisionVal = document.getElementById('att-division')?.value || 'D1';
    const subjectVal = document.getElementById('att-subject')?.value;

    if (!subjectVal) return;

    try {
      // 1. Fetch Students for Class & Division
      const studentsRes = await API.getStudents({ class: classVal, division: divisionVal });
      // 2. Fetch Existing Attendance Records for Date & Subject
      const attRes = await API.getAttendance({ date: dateVal, subject_id: subjectVal });

      if (studentsRes.success) {
        rosterStudents = studentsRes.data;
        markingState = {};

        const existingMap = {};
        if (attRes.success && attRes.data) {
          attRes.data.forEach(rec => {
            existingMap[rec.student_id] = rec.status;
          });
        }

        // Initialize state (default Present if not previously marked)
        rosterStudents.forEach(student => {
          markingState[student.id] = existingMap[student.id] || 'Present';
        });

        renderRosterTable();
      }
    } catch (err) {
      console.error('Error loading roster:', err);
    }
  }

  // Render Roster Table
  function renderRosterTable() {
    const tbody = document.getElementById('attendance-roster-body');
    const countDisplay = document.getElementById('roster-count');

    if (countDisplay) countDisplay.textContent = rosterStudents.length;
    if (!tbody) return;

    if (rosterStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">No students found in Class ${document.getElementById('att-class').value} - ${document.getElementById('att-division').value}</td></tr>`;
      return;
    }

    tbody.innerHTML = rosterStudents.map(student => {
      const currentStatus = markingState[student.id] || 'Present';
      const isPresent = currentStatus === 'Present';

      return `
        <tr>
          <td style="font-weight:600;color:var(--primary);">${student.roll_no}</td>
          <td style="font-weight:600;">${student.name}</td>
          <td>${student.email}</td>
          <td>${student.class} - ${student.division}</td>
          <td>
            <div class="attendance-toggle-group">
              <button type="button" class="toggle-btn present ${isPresent ? 'active' : ''}" data-id="${student.id}" data-status="Present">
                <i class="fa-solid fa-check"></i> PRESENT
              </button>
              <button type="button" class="toggle-btn absent ${!isPresent ? 'active' : ''}" data-id="${student.id}" data-status="Absent">
                <i class="fa-solid fa-xmark"></i> ABSENT
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Toggle Button Listeners
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.id;
        const status = e.currentTarget.dataset.status;

        markingState[studentId] = status;

        // Toggle UI button classes in row
        const row = e.currentTarget.closest('tr');
        row.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
  }

  // Mark All Present
  const markAllPresentBtn = document.getElementById('btn-mark-all-present');
  if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener('click', () => {
      rosterStudents.forEach(student => { markingState[student.id] = 'Present'; });
      renderRosterTable();
    });
  }

  // Mark All Absent
  const markAllAbsentBtn = document.getElementById('btn-mark-all-absent');
  if (markAllAbsentBtn) {
    markAllAbsentBtn.addEventListener('click', () => {
      rosterStudents.forEach(student => { markingState[student.id] = 'Absent'; });
      renderRosterTable();
    });
  }

  // Submit Attendance Handler
  const submitBtn = document.getElementById('btn-submit-attendance');
  const alertBanner = document.getElementById('attendance-alert');

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const dateVal = document.getElementById('att-date').value;
      const subjectVal = document.getElementById('att-subject').value;

      if (!dateVal || !subjectVal) {
        alert('Please select both Date and Subject.');
        return;
      }

      if (rosterStudents.length === 0) {
        alert('No students in roster to submit.');
        return;
      }

      const items = rosterStudents.map(student => ({
        student_id: student.id,
        subject_id: parseInt(subjectVal),
        attendance_date: dateVal,
        status: markingState[student.id] || 'Present'
      }));

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

      try {
        const res = await API.submitAttendance(items);
        if (res.success) {
          alertBanner.className = 'alert-warning-banner';
          alertBanner.style.backgroundColor = '#ecfdf5';
          alertBanner.style.borderColor = '#6ee7b7';
          alertBanner.style.color = '#065f46';
          alertBanner.innerHTML = `
            <i class="fa-solid fa-circle-check" style="color:#10b981;font-size:20px;"></i>
            <div>
              <strong>Attendance Recorded Successfully!</strong>
              Submitted status for ${res.savedCount} student(s) on ${dateVal}.
            </div>
          `;
          alertBanner.style.display = 'flex';
          setTimeout(() => { alertBanner.style.display = 'none'; }, 4000);
        } else {
          alertBanner.style.display = 'block';
          alertBanner.textContent = res.message || 'Error submitting attendance.';
        }
      } catch (err) {
        console.error('Error submitting attendance:', err);
        alert('Server error while submitting attendance.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Submit Attendance`;
      }
    });
  }

  // Filter change triggers
  ['att-date', 'att-class', 'att-division', 'att-subject'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadRoster);
  });

  const loadBtn = document.getElementById('btn-load-roster');
  if (loadBtn) loadBtn.addEventListener('click', loadRoster);

  // Initial Load
  loadSubjectDropdown();
});
