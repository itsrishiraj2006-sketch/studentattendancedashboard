const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const seed = require('../src/database/seed');
const { calculateAttendanceStatus, calculateStudentAttendanceStats } = require('../src/utils/attendanceCalculator');

test('Attendance Calculator - Status Classification', async () => {
  const thresholds = { high: 75, low: 60 };

  assert.equal(calculateAttendanceStatus(85, thresholds), 'HIGH');
  assert.equal(calculateAttendanceStatus(75, thresholds), 'HIGH');
  assert.equal(calculateAttendanceStatus(74.99, thresholds), 'AVERAGE');
  assert.equal(calculateAttendanceStatus(60, thresholds), 'AVERAGE');
  assert.equal(calculateAttendanceStatus(59.9, thresholds), 'LOW');
  assert.equal(calculateAttendanceStatus(0, thresholds), 'LOW');
});

test('Attendance Calculator - Configurable Thresholds', async () => {
  const customThresholds = { high: 80, low: 50 };

  assert.equal(calculateAttendanceStatus(78, customThresholds), 'AVERAGE');
  assert.equal(calculateAttendanceStatus(55, customThresholds), 'AVERAGE');
  assert.equal(calculateAttendanceStatus(45, customThresholds), 'LOW');
});

test('Database Initialization & Seed Integrity', async () => {
  await db.init();
  await seed();

  const { rows: users } = await db.query('SELECT * FROM users');
  assert.ok(users.length >= 10, 'Should have at least 10 users');

  const { rows: students } = await db.query('SELECT * FROM students');
  assert.ok(students.length >= 10, 'Should have at least 10 students');

  const { rows: subjects } = await db.query('SELECT * FROM subjects');
  assert.ok(subjects.length >= 5, 'Should have at least 5 core subjects');

  const { rows: attendance } = await db.query('SELECT * FROM attendance');
  assert.ok(attendance.length > 0, 'Should have attendance records populated');
});

test('Student Attendance Calculation Accuracy', async () => {
  const mockSubjects = [
    { id: 1, name: 'Data Structures', code: 'CS201' },
    { id: 2, name: 'DBMS', code: 'CS202' }
  ];

  const mockRecords = [
    { subject_id: 1, status: 'PRESENT' },
    { subject_id: 1, status: 'PRESENT' },
    { subject_id: 1, status: 'PRESENT' },
    { subject_id: 1, status: 'ABSENT' }, // 3/4 = 75%
    { subject_id: 2, status: 'PRESENT' },
    { subject_id: 2, status: 'ABSENT' }  // 1/2 = 50%
  ];

  const stats = calculateStudentAttendanceStats(mockRecords, mockSubjects, { high: 75, low: 60 }, 0.5);

  assert.equal(stats.totalClasses, 6);
  assert.equal(stats.totalAttended, 4);
  assert.equal(stats.totalMissed, 2);
  assert.equal(stats.subjectStats[0].percentage, 75);
  assert.equal(stats.subjectStats[0].status, 'HIGH');
  assert.equal(stats.subjectStats[1].percentage, 50);
  assert.equal(stats.subjectStats[1].status, 'LOW');
});
