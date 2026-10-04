/* ========================================================
   Student Management Controller Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let allStudents = [];

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Load Students from API
  async function loadStudents() {
    const classVal = document.getElementById('students-filter-class')?.value || 'All';
    const divisionVal = document.getElementById('students-filter-division')?.value || 'All';
    const searchVal = document.getElementById('student-search-input')?.value || '';

    try {
      const res = await API.getStudents({ class: classVal, division: divisionVal, search: searchVal });
      if (res.success) {
        allStudents = res.data;
        renderStudentsTable(allStudents);
      }
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }

  // Render Table Rows
  function renderStudentsTable(students) {
    const tbody = document.getElementById('students-table-body');
    const countDisplay = document.getElementById('student-count-display');
    
    if (countDisplay) countDisplay.textContent = students.length;
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">No matching student records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      let badgeClass = 'badge-good';
      if (s.attendancePercentage >= 90) badgeClass = 'badge-excellent';
      else if (s.attendancePercentage >= 80) badgeClass = 'badge-good';
      else if (s.attendancePercentage >= 75) badgeClass = 'badge-satisfactory';
      else badgeClass = 'badge-low';

      return `
        <tr>
          <td style="font-weight:600;color:var(--primary);">${s.roll_no}</td>
          <td style="font-weight:600;">${s.name}</td>
          <td>${s.email}</td>
          <td>${s.class} - ${s.division}</td>
          <td>${s.department}</td>
          <td style="font-weight:700;color:${s.attendancePercentage < 75 ? '#ef4444' : '#10b981'};">${s.attendancePercentage}%</td>
          <td><span class="badge ${badgeClass}">${s.status}</span></td>
          <td style="text-align:right;">
            <button class="action-btn view-student" data-id="${s.id}" title="View Detailed Profile"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn edit-student" data-id="${s.id}" title="Edit Student"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="action-btn delete delete-student" data-id="${s.id}" title="Delete Student"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row action listeners
    document.querySelectorAll('.view-student').forEach(btn => {
      btn.addEventListener('click', (e) => openStudentProfileModal(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.edit-student').forEach(btn => {
      btn.addEventListener('click', (e) => openEditStudentModal(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => deleteStudent(e.currentTarget.dataset.id));
    });
  }

  // Open Add Student Modal
  const addStudentBtn = document.getElementById('btn-open-add-student');
  const formModal = document.getElementById('add-edit-student-modal');
  const studentForm = document.getElementById('student-form');
  const formTitle = document.getElementById('modal-form-title');
  const errorMsg = document.getElementById('form-error-msg');

  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
      formTitle.textContent = 'Add New Student';
      studentForm.reset();
      document.getElementById('form-student-id').value = '';
      errorMsg.style.display = 'none';
      formModal.classList.add('active');
    });
  }

  // Open Edit Student Modal
  function openEditStudentModal(id) {
    const student = allStudents.find(s => s.id == id);
    if (!student) return;

    formTitle.textContent = 'Edit Student Details';
    document.getElementById('form-student-id').value = student.id;
    document.getElementById('form-roll-no').value = student.roll_no;
    document.getElementById('form-name').value = student.name;
    document.getElementById('form-email').value = student.email;
    document.getElementById('form-class').value = student.class;
    document.getElementById('form-division').value = student.division;
    document.getElementById('form-department').value = student.department;
    errorMsg.style.display = 'none';

    formModal.classList.add('active');
  }

  // Close Form Modal
  const closeFormModalBtn = document.getElementById('btn-close-form-modal');
  const cancelFormBtn = document.getElementById('btn-cancel-student-form');
  if (closeFormModalBtn) closeFormModalBtn.addEventListener('click', () => formModal.classList.remove('active'));
  if (cancelFormBtn) cancelFormBtn.addEventListener('click', () => formModal.classList.remove('active'));

  // Submit Student Add/Edit Form
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('form-student-id').value;
      const roll_no = document.getElementById('form-roll-no').value.trim();
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const studentClass = document.getElementById('form-class').value;
      const division = document.getElementById('form-division').value;
      const department = document.getElementById('form-department').value.trim();

      const payload = { roll_no, name, email, class: studentClass, division, department };

      try {
        let res;
        if (id) {
          res = await API.updateStudent(id, payload);
        } else {
          res = await API.createStudent(payload);
        }

        if (res.success) {
          formModal.classList.remove('active');
          loadStudents();
        } else {
          errorMsg.textContent = res.message || 'Error processing request.';
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        errorMsg.textContent = 'Server error occurred.';
        errorMsg.style.display = 'block';
      }
    });
  }

  // Delete Student Handler
  async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student record and all associated attendance data?')) {
      try {
        const res = await API.deleteStudent(id);
        if (res.success) {
          loadStudents();
        }
      } catch (err) {
        console.error('Error deleting student:', err);
      }
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
      console.error('Error fetching student profile:', err);
      modalBody.innerHTML = `<p style="color:#ef4444;">Failed to load profile.</p>`;
    }
  }

  // Profile modal close buttons
  const modalCloseBtn = document.getElementById('btn-close-modal');
  const modalDoneBtn = document.getElementById('btn-modal-done');
  const modalOverlay = document.getElementById('student-detail-modal');

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));

  // Attach search & filter events
  document.getElementById('students-filter-class')?.addEventListener('change', loadStudents);
  document.getElementById('students-filter-division')?.addEventListener('change', loadStudents);
  document.getElementById('student-search-input')?.addEventListener('input', loadStudents);

  // Initial Load
  loadStudents();
});
