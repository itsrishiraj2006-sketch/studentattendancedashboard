-- ========================================================
-- Student Attendance Dashboard - Database Schema & Seed Data
-- Course: Interactive Data Visualization using D3.js (B.Tech 2nd Year)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `student_attendance_db`;
USE `student_attendance_db`;

-- 1. Drop existing tables if re-initialization is needed
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `subjects`;

-- 2. Create `students` table
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roll_no` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `class` VARCHAR(10) NOT NULL,
  `division` VARCHAR(10) NOT NULL,
  `department` VARCHAR(50) NOT NULL DEFAULT 'Computer Science',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create `subjects` table
CREATE TABLE `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_code` VARCHAR(20) NOT NULL UNIQUE,
  `subject_name` VARCHAR(100) NOT NULL,
  `faculty_name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create `attendance` table
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `attendance_date` DATE NOT NULL,
  `status` ENUM('Present', 'Absent') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `unique_daily_attendance` UNIQUE (`student_id`, `subject_id`, `attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for fast filter queries
CREATE INDEX `idx_attendance_date` ON `attendance`(`attendance_date`);
CREATE INDEX `idx_attendance_status` ON `attendance`(`status`);
CREATE INDEX `idx_student_class_div` ON `students`(`class`, `division`);

-- ========================================================
-- Seed Data Insertion
-- ========================================================

-- Insert 5 Core Subjects
INSERT INTO `subjects` (`id`, `subject_code`, `subject_name`, `faculty_name`) VALUES
(1, 'CS201', 'Data Structures & Algorithms', 'Dr. Rajesh Sharma'),
(2, 'CS202', 'Database Management Systems', 'Prof. Anita Verma'),
(3, 'CS203', 'Java Programming', 'Dr. Vikramaditya Rao'),
(4, 'CS204', 'Computer Architecture', 'Prof. Meenakshi Sundaram'),
(5, 'CS205', 'Mathematics III', 'Dr. Sanjay Kulkarni');

-- Insert 20 B.Tech 2nd Year Students
INSERT INTO `students` (`id`, `roll_no`, `name`, `email`, `class`, `division`, `department`) VALUES
(1, '2025CS101', 'Aarav Patel', 'aarav.patel@college.edu', '2A', 'D1', 'Computer Science'),
(2, '2025CS102', 'Ananya Sharma', 'ananya.sharma@college.edu', '2A', 'D1', 'Computer Science'),
(3, '2025CS103', 'Rohan Gupta', 'rohan.gupta@college.edu', '2A', 'D1', 'Computer Science'),
(4, '2025CS104', 'Priya Iyer', 'priya.iyer@college.edu', '2A', 'D1', 'Computer Science'),
(5, '2025CS105', 'Kabir Mehta', 'kabir.mehta@college.edu', '2A', 'D1', 'Computer Science'),
(6, '2025CS106', 'Diya Joshi', 'diya.joshi@college.edu', '2A', 'D2', 'Computer Science'),
(7, '2025CS107', 'Aditya Verma', 'aditya.verma@college.edu', '2A', 'D2', 'Computer Science'),
(8, '2025CS108', 'Sneha Reddy', 'sneha.reddy@college.edu', '2A', 'D2', 'Computer Science'),
(9, '2025CS109', 'Ishaan Malhotra', 'ishaan.malhotra@college.edu', '2A', 'D2', 'Computer Science'),
(10, '2025CS110', 'Kavya Nair', 'kavya.nair@college.edu', '2A', 'D2', 'Computer Science'),
(11, '2025CS111', 'Devansh Singh', 'devansh.singh@college.edu', '2B', 'D1', 'Information Tech'),
(12, '2025CS112', 'Tanvi Deshmukh', 'tanvi.deshmukh@college.edu', '2B', 'D1', 'Information Tech'),
(13, '2025CS113', 'Arjun Kapoor', 'arjun.kapoor@college.edu', '2B', 'D1', 'Information Tech'),
(14, '2025CS114', 'Riya Bansal', 'riya.bansal@college.edu', '2B', 'D1', 'Information Tech'),
(15, '2025CS115', 'Siddharth Rao', 'siddharth.rao@college.edu', '2B', 'D1', 'Information Tech'),
(16, '2025CS116', 'Meera Kulkarni', 'meera.kulkarni@college.edu', '2B', 'D2', 'Information Tech'),
(17, '2025CS117', 'Varun Agarwal', 'varun.agarwal@college.edu', '2B', 'D2', 'Information Tech'),
(18, '2025CS118', 'Pooja Pandey', 'pooja.pandey@college.edu', '2B', 'D2', 'Information Tech'),
(19, '2025CS119', 'Yash Choudhary', 'yash.choudhary@college.edu', '2B', 'D2', 'Information Tech'),
(20, '2025CS120', 'Neha Bhat', 'neha.bhat@college.edu', '2B', 'D2', 'Information Tech');

-- Insert initial sample attendance records
INSERT INTO `attendance` (`student_id`, `subject_id`, `attendance_date`, `status`) VALUES
(1, 1, '2026-08-01', 'Present'), (1, 2, '2026-08-01', 'Present'), (1, 3, '2026-08-02', 'Present'), (1, 4, '2026-08-02', 'Present'), (1, 5, '2026-08-03', 'Present'),
(2, 1, '2026-08-01', 'Present'), (2, 2, '2026-08-01', 'Present'), (2, 3, '2026-08-02', 'Absent'),  (2, 4, '2026-08-02', 'Present'), (2, 5, '2026-08-03', 'Present'),
(3, 1, '2026-08-01', 'Absent'),  (3, 2, '2026-08-01', 'Present'), (3, 3, '2026-08-02', 'Absent'),  (3, 4, '2026-08-02', 'Present'), (3, 5, '2026-08-03', 'Absent'),
(4, 1, '2026-08-01', 'Present'), (4, 2, '2026-08-01', 'Present'), (4, 3, '2026-08-02', 'Present'), (4, 4, '2026-08-02', 'Present'), (4, 5, '2026-08-03', 'Present'),
(5, 1, '2026-08-01', 'Present'), (5, 2, '2026-08-01', 'Absent'),  (5, 3, '2026-08-02', 'Present'), (5, 4, '2026-08-02', 'Present'), (5, 5, '2026-08-03', 'Present');
