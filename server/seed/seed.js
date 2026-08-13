/**
 * Database seed (spec §37).
 *
 * Users:  1 admin, 5 faculty, 15 alumni, 30 students
 * Content: events, meetings, scholarships (+ donations), jobs, resources,
 *          announcements, posts (+ likes/comments), connections
 *
 * Usage:
 *   npm run seed            # inserts only if the admin account is missing
 *   npm run seed -- --force # wipes seeded collections, then re-inserts
 *
 * Demo credentials are printed at the end and documented in the README.
 */
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import AuditLog from '../models/auditLog.js';
import RefreshToken from '../models/refreshToken.js';
import Event from '../models/event.js';
import EventRegistration from '../models/eventRegistration.js';
import Meeting from '../models/meeting.js';
import MeetingParticipant from '../models/meetingParticipant.js';
import Scholarship from '../models/scholarship.js';
import Donation from '../models/donation.js';
import Payment from '../models/payment.js';
import Job from '../models/job.js';
import Resource from '../models/resource.js';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import Like from '../models/like.js';
import Announcement from '../models/announcement.js';
import Connection from '../models/connection.js';
import Notification from '../models/notification.js';
import Conversation from '../models/conversation.js';
import Message from '../models/message.js';
import CareerRoadmap from '../models/careerRoadmap.js';
import { ROADMAP_SEEDS } from './roadmaps.js';

const force = process.argv.includes('--force');

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const FACULTY = [
  { name: 'Prof. Sunita Sharma', employeeId: 'FAC-1001', department: 'Computer Science', designation: 'Professor & Head', subjects: ['Data Structures', 'Algorithms'] },
  { name: 'Dr. Rajesh Gupta', employeeId: 'FAC-1002', department: 'Electronics & Communication', designation: 'Associate Professor', subjects: ['VLSI Design', 'Digital Electronics'] },
  { name: 'Dr. Priya Nair', employeeId: 'FAC-1003', department: 'Mechanical', designation: 'Associate Professor', subjects: ['Thermodynamics', 'Fluid Mechanics'] },
  { name: 'Prof. Amit Joshi', employeeId: 'FAC-1004', department: 'Civil', designation: 'Assistant Professor', subjects: ['Structural Analysis'] },
  { name: 'Dr. Kavita Rao', employeeId: 'FAC-1005', department: 'Electrical', designation: 'Professor', subjects: ['Power Systems', 'Control Theory'] },
];

const ALUMNI = [
  { name: 'Rohan Mehta', graduationYear: 2019, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'Google', designation: 'Senior Software Engineer', industry: 'Software / IT Services', skills: ['Python', 'Go', 'System Design', 'Distributed Systems'], location: 'Bengaluru', availableForMentorship: true, mentorshipAreas: ['dsa', 'interview_preparation', 'career'] },
  { name: 'Ananya Iyer', graduationYear: 2020, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'Amazon', designation: 'SDE-II', industry: 'Software / IT Services', skills: ['Java', 'AWS', 'Microservices'], location: 'Hyderabad', availableForMentorship: true, mentorshipAreas: ['dsa', 'web_development'] },
  { name: 'Karan Malhotra', graduationYear: 2018, department: 'Electronics & Communication', degree: 'B.Tech', currentCompany: 'Qualcomm', designation: 'Hardware Engineer', industry: 'Manufacturing', skills: ['Embedded C', 'Verilog', 'PCB Design'], location: 'Noida' },
  { name: 'Sneha Kulkarni', graduationYear: 2021, department: 'Computer Science', degree: 'M.Tech', currentCompany: 'Microsoft', designation: 'Program Manager', industry: 'Software / IT Services', skills: ['Product Management', 'Azure', 'Data Analytics'], location: 'Bengaluru', availableForMentorship: true, mentorshipAreas: ['career', 'interview_preparation'] },
  { name: 'Arjun Singh', graduationYear: 2017, department: 'Mechanical', degree: 'B.Tech', currentCompany: 'Tata Motors', designation: 'Senior Design Engineer', industry: 'Manufacturing', skills: ['CATIA', 'ANSYS', 'GD&T'], location: 'Pune' },
  { name: 'Priyanka Desai', graduationYear: 2020, department: 'Electrical', degree: 'B.Tech', currentCompany: 'Siemens', designation: 'Automation Engineer', industry: 'Manufacturing', skills: ['PLC', 'SCADA', 'Python'], location: 'Mumbai' },
  { name: 'Vikram Reddy', graduationYear: 2019, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'Flipkart', designation: 'SDE-II', industry: 'Software / IT Services', skills: ['Node.js', 'React', 'MongoDB', 'System Design'], location: 'Bengaluru', availableForMentorship: true, mentorshipAreas: ['web_development', 'dsa'] },
  { name: 'Divya Menon', graduationYear: 2022, department: 'Electronics & Communication', degree: 'B.Tech', currentCompany: 'Infosys', designation: 'Systems Engineer', industry: 'Software / IT Services', skills: ['Java', 'Spring Boot', 'SQL'], location: 'Pune' },
  { name: 'Aditya Verma', graduationYear: 2016, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'Paytm', designation: 'Engineering Manager', industry: 'Fintech', skills: ['Leadership', 'Node.js', 'Kubernetes'], location: 'Noida', availableForMentorship: true, mentorshipAreas: ['career', 'devops', 'cloud'] },
  { name: 'Meghana Bhat', graduationYear: 2021, department: 'Civil', degree: 'B.Tech', currentCompany: 'L&T Construction', designation: 'Site Engineer', industry: 'Manufacturing', skills: ['AutoCAD', 'Project Management'], location: 'Chennai' },
  { name: 'Siddharth Jain', graduationYear: 2018, department: 'Mechanical', degree: 'B.Tech', currentCompany: 'Bosch', designation: 'R&D Engineer', industry: 'Manufacturing', skills: ['SolidWorks', 'Simulation', 'IoT'], location: 'Bengaluru' },
  { name: 'Ishita Roy', graduationYear: 2020, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'Zomato', designation: 'Data Scientist', industry: 'Software / IT Services', skills: ['Python', 'ML', 'SQL', 'Statistics'], location: 'Gurugram', availableForMentorship: true, mentorshipAreas: ['ai_ml', 'career'] },
  { name: 'Nikhil Saxena', graduationYear: 2015, department: 'Electrical', degree: 'B.Tech', currentCompany: 'Adani Power', designation: 'Deputy Manager', industry: 'Energy', skills: ['Power Distribution', 'Team Management'], location: 'Ahmedabad' },
  { name: 'Tanvi Shah', graduationYear: 2022, department: 'Electronics & Communication', degree: 'B.Tech', currentCompany: 'Accenture', designation: 'Software Engineer', industry: 'Consulting', skills: ['Salesforce', 'Apex', 'JavaScript'], location: 'Mumbai' },
  { name: 'Harsh Agarwal', graduationYear: 2019, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'CRED', designation: 'Backend Engineer', industry: 'Fintech', skills: ['Go', 'Kafka', 'Docker'], location: 'Bengaluru', availableForMentorship: true, mentorshipAreas: ['devops', 'interview_preparation'] },
];

const STUDENTS = [
  { name: 'Aarav Patel', rollNumber: 'CSE-2025-001', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['JavaScript', 'React'], location: 'Gorakhpur' },
  { name: 'Diya Sharma', rollNumber: 'CSE-2025-002', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['Python', 'Django'], location: 'Lucknow' },
  { name: 'Ishaan Gupta', rollNumber: 'ECE-2025-011', department: 'Electronics & Communication', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['C', 'Arduino'], location: 'Varanasi' },
  { name: 'Ananya Singh', rollNumber: 'CSE-2024-001', department: 'Computer Science', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['Java', 'Spring Boot'], location: 'Kanpur' },
  { name: 'Kabir Khan', rollNumber: 'ME-2025-021', department: 'Mechanical', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['AutoCAD', 'SolidWorks'], location: 'Gorakhpur' },
  { name: 'Saanvi Joshi', rollNumber: 'EE-2024-031', department: 'Electrical', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['MATLAB', 'Python'], location: 'Allahabad' },
  { name: 'Vihaan Reddy', rollNumber: 'CE-2025-041', department: 'Civil', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['AutoCAD', 'STAAD Pro'], location: 'Lucknow' },
  { name: 'Aadhya Nair', rollNumber: 'CSE-2023-003', department: 'Computer Science', course: 'B.Tech', year: 5, graduationYear: 2024, skills: ['MERN', 'System Design'], location: 'Kochi' },
  { name: 'Advik Mehta', rollNumber: 'CSE-2026-001', department: 'Computer Science', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['C++', 'DSA'], location: 'Gorakhpur' },
  { name: 'Myra Kapoor', rollNumber: 'ECE-2024-012', department: 'Electronics & Communication', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['VHDL', 'Verilog'], location: 'Delhi' },
  { name: 'Reyansh Tiwari', rollNumber: 'CSE-2025-004', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['Flutter', 'Firebase'], location: 'Gorakhpur' },
  { name: 'Anika Bansal', rollNumber: 'ME-2024-022', department: 'Mechanical', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['ANSYS', 'CFD'], location: 'Jaipur' },
  { name: 'Arnav Chauhan', rollNumber: 'EE-2025-032', department: 'Electrical', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['PLC', 'IoT'], location: 'Ghaziabad' },
  { name: 'Riya Kapadia', rollNumber: 'CSE-2026-002', department: 'Computer Science', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['Python', 'Machine Learning'], location: 'Surat' },
  { name: 'Dev Mishra', rollNumber: 'CE-2024-042', department: 'Civil', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['Revit', 'Surveying'], location: 'Patna' },
  { name: 'Ira Sengupta', rollNumber: 'ECE-2025-013', department: 'Electronics & Communication', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['Embedded Systems', 'RTOS'], location: 'Kolkata' },
  { name: 'Yuvraj Gill', rollNumber: 'CSE-2023-004', department: 'Computer Science', course: 'B.Tech', year: 5, graduationYear: 2024, skills: ['AWS', 'Docker'], location: 'Chandigarh' },
  { name: 'Kiara Advani', rollNumber: 'ME-2026-023', department: 'Mechanical', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['SolidWorks', '3D Printing'], location: 'Indore' },
  { name: 'Ayaan Qureshi', rollNumber: 'EE-2023-033', department: 'Electrical', course: 'B.Tech', year: 5, graduationYear: 2024, skills: ['Power Electronics'], location: 'Bhopal' },
  { name: 'Navya Bhat', rollNumber: 'CSE-2024-005', department: 'Computer Science', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['React', 'Node.js', 'MongoDB'], location: 'Mysuru' },
  { name: 'Krishna Iyer', rollNumber: 'CE-2026-043', department: 'Civil', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['AutoCAD'], location: 'Coimbatore' },
  { name: 'Pari Chauhan', rollNumber: 'ECE-2023-014', department: 'Electronics & Communication', course: 'B.Tech', year: 5, graduationYear: 2024, skills: ['Signal Processing', 'DSP'], location: 'Nagpur' },
  { name: 'Shaurya Rathore', rollNumber: 'CSE-2026-003', department: 'Computer Science', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['Java', 'Android'], location: 'Jodhpur' },
  { name: 'Zara Sheikh', rollNumber: 'ME-2025-024', department: 'Mechanical', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['CATIA', 'FEA'], location: 'Hyderabad' },
  { name: 'Aarohi Kulkarni', rollNumber: 'EE-2026-034', department: 'Electrical', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['Python', 'Data Analysis'], location: 'Pune' },
  { name: 'Vivaan Khanna', rollNumber: 'CSE-2023-006', department: 'Computer Science', course: 'B.Tech', year: 5, graduationYear: 2024, skills: ['Go', 'Kubernetes'], location: 'Amritsar' },
  { name: 'Aanya Malhotra', rollNumber: 'CE-2025-044', department: 'Civil', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['GIS', 'AutoCAD'], location: 'Dehradun' },
  { name: 'Rudraksh Pandey', rollNumber: 'ECE-2026-015', department: 'Electronics & Communication', course: 'B.Tech', year: 2, graduationYear: 2027, skills: ['Python', 'Raspberry Pi'], location: 'Varanasi' },
  { name: 'Sara Fernandes', rollNumber: 'CSE-2025-007', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2026, skills: ['UI/UX', 'Figma'], location: 'Goa' },
  { name: 'Aryan Thakur', rollNumber: 'ME-2024-025', department: 'Mechanical', course: 'B.Tech', year: 4, graduationYear: 2025, skills: ['Thermal Analysis', 'ANSYS'], location: 'Shimla' },
];

const ADMIN = { name: 'Campus Administrator', email: 'admin@campus.edu' };

const PASSWORD_BY_ROLE = {
  admin: 'Admin@123',
  faculty: 'Faculty@123',
  alumni: 'Alumni@123',
  student: 'Student@123',
};

// ---------------------------------------------------------------------------
// Content seed data
// ---------------------------------------------------------------------------
const EVENT_SEEDS = [
  { title: 'Placement Prep Seminar: Resume & Interviews', description: 'A practical session on building strong resumes and cracking HR + technical interviews, led by the placement cell.', organizer: 'faculty1', date: addDays(6), startTime: '10:00', endTime: '12:30', venue: 'Auditorium', mode: 'offline', category: 'placement', department: 'Computer Science', maxParticipants: 120 },
  { title: 'Webinar: Careers in AI/ML', description: 'How to start a career in AI/ML — skills, projects, and landing your first role. Live Q&A with a data scientist.', organizer: 'alumni12', date: addDays(10), startTime: '18:00', endTime: '19:30', mode: 'online', meetingLink: 'https://meet.google.com/ai-ml-careers', category: 'webinar', department: 'Computer Science', maxParticipants: 200 },
  { title: 'MERN Stack Hands-on Workshop', description: 'Build and deploy a full-stack MERN application from scratch in this hands-on lab session.', organizer: 'faculty2', date: addDays(14), startTime: '14:00', endTime: '17:00', venue: 'Lab 3, CS Block', mode: 'offline', category: 'workshop', department: 'Computer Science', maxParticipants: 40 },
  { title: 'Campus CodeFest Hackathon', description: '24-hour hackathon. Build a solution for a social impact problem statement. Teams of up to 4. Prizes for top 3 teams.', organizer: 'faculty3', date: addDays(21), startTime: '09:00', endTime: '09:00', venue: 'Innovation Hall', mode: 'offline', category: 'hackathon', department: 'Computer Science', maxParticipants: 200 },
  { title: 'Alumni Meet 2026 — Bengaluru Chapter', description: 'Annual alumni meet for the Bengaluru chapter. Networking, mentorship speed-dating, and dinner.', organizer: 'alumni1', date: addDays(28), startTime: '17:00', endTime: '21:00', venue: 'The Ritz Club, Bengaluru', mode: 'offline', category: 'alumni_meet', department: 'Computer Science', maxParticipants: 150 },
  { title: 'Technical Seminar: System Design for Interviews', description: 'Senior engineers walk through designing scalable systems — the exact patterns asked in interviews.', organizer: 'alumni2', date: addDays(35), startTime: '11:00', endTime: '13:00', mode: 'online', meetingLink: 'https://meet.google.com/sys-design', category: 'technical_seminar', department: 'Computer Science', maxParticipants: 150 },
  { title: 'Annual Sports Day', description: 'Inter-department sports competitions across cricket, football, athletics, and chess.', organizer: 'faculty4', date: addDays(-25), startTime: '08:00', endTime: '17:00', venue: 'Main Ground', mode: 'offline', category: 'sports', status: 'completed', maxParticipants: 300 },
];

const JOB_SEEDS = [
  { title: 'SDE Intern', company: 'Google', type: 'internship', description: '12-week software engineering internship for 2nd/3rd year students. Strong DSA fundamentals required.', location: 'Bengaluru', workMode: 'hybrid', salary: '₹60,000 / month', experience: 'Fresher', skills: ['DSA', 'C++', 'Python'], eligibility: 'B.Tech CSE/IT 2nd-3rd year', deadline: addDays(20), applyThroughPlatform: true },
  { title: 'Software Development Engineer I', company: 'Amazon', type: 'job', description: 'SDE I role in the Payments team. Own features end to end — design, code, deploy, and monitor.', location: 'Hyderabad', workMode: 'hybrid', salary: '₹20-28 LPA', experience: '0-2 years', skills: ['Java', 'AWS', 'System Design'], eligibility: '2024/2025 grads', deadline: addDays(30), applyThroughPlatform: false, applicationLink: 'https://amazon.jobs' },
  { title: 'Backend Engineer', company: 'CRED', type: 'job', description: 'Join the core backend team building high-scale financial products in Go.', location: 'Bengaluru', workMode: 'onsite', salary: '₹25-40 LPA', experience: '1-4 years', skills: ['Go', 'Kafka', 'Docker'], deadline: addDays(15), applyThroughPlatform: true },
  { title: 'Data Science Intern', company: 'Zomato', type: 'internship', description: 'Work with the analytics team on customer segmentation and recommendation models.', location: 'Gurugram', workMode: 'remote', salary: '₹40,000 / month', experience: 'Fresher', skills: ['Python', 'SQL', 'ML'], eligibility: 'Final year or recent grads', deadline: addDays(18), applyThroughPlatform: true },
  { title: 'Freelance: Frontend Developer', company: 'LaunchPad Studio', type: 'freelance', description: 'Build marketing websites for early-stage startups. React + Tailwind. Flexible hours, remote.', location: 'Remote', workMode: 'remote', salary: '₹25,000-50,000 / project', experience: 'Any', skills: ['React', 'Tailwind CSS', 'JavaScript'], deadline: addDays(10), applyThroughPlatform: true },
];

const SCHOLARSHIP_SEEDS = [
  { name: 'Merit Scholarship Fund', description: 'Annual scholarship for meritorious students from economically weaker backgrounds. Covers tuition for one academic year.', eligibility: 'Family income below ₹3,00,000/year; CGPA above 7.5; no active backlogs', minimumRequirements: ['CGPA ≥ 7.5', 'Annual family income ≤ ₹3L', 'Full-time enrolled student'], maxApplicants: 10, amount: 50000, targetAmount: 500000, deadline: addDays(60), requiredDocuments: ['Income certificate', 'Academic records', 'ID proof'], sponsor: 'alumni1', category: 'need_based' },
  { name: 'Women in Tech Scholarship', description: 'Supporting women pursuing technology degrees. Mentorship from alumni included.', eligibility: 'Female students in CSE/ECE/IT with CGPA above 7.0', minimumRequirements: ['CGPA ≥ 7.0', 'Female student in a tech branch'], maxApplicants: 8, amount: 40000, targetAmount: 300000, deadline: addDays(45), requiredDocuments: ['Academic records', 'Statement of purpose'], sponsor: 'alumni4', category: 'special' },
  { name: 'First-Generation Student Support', description: 'For students who are the first in their family to attend college.', eligibility: 'First-generation college student; family income below ₹2,50,000/year', minimumRequirements: ['First-generation student', 'Family income ≤ ₹2.5L'], maxApplicants: 12, amount: 25000, targetAmount: 200000, deadline: addDays(75), requiredDocuments: ['Income certificate', 'Academic records'], sponsor: 'faculty1', category: 'need_based' },
  { name: 'ECE Excellence Award', description: 'Awarded to the top-performing ECE students for project excellence.', eligibility: 'ECE students with strong academic + project record', minimumRequirements: ['CGPA ≥ 8.0', 'ECE department'], maxApplicants: 5, amount: 30000, targetAmount: 150000, deadline: addDays(90), requiredDocuments: ['Academic records', 'Project report'], sponsor: 'alumni3', category: 'merit_based' },
];

// donationAmounts: [scholarshipIndex, donorIndex (alumni 1-based), amount]
const DONATION_SEEDS = [
  { scholarship: 0, donor: 1, amount: 50000, message: 'Keep supporting bright students!' },
  { scholarship: 0, donor: 7, amount: 25000, message: 'Happy to give back to campus.' },
  { scholarship: 0, donor: 9, amount: 30000 },
  { scholarship: 1, donor: 2, amount: 50000, message: 'Proud to support women in tech.' },
  { scholarship: 1, donor: 15, amount: 25000 },
  { scholarship: 3, donor: 5, amount: 80000, message: 'For the ECE project excellence fund.' },
];

const RESOURCE_SEEDS = [
  { title: 'GATE CS: Operating Systems — PYQ Compilation', description: 'Previous year GATE questions on OS topics with solutions.', category: 'GATE', subCategory: 'OS', fileType: 'external', externalUrl: 'https://www.geeksforgeeks.org/operating-systems/', uploadedBy: 'faculty1', tags: ['gate', 'os', 'pyq'] },
  { title: 'DSA Roadmap — Arrays & Hashing', description: 'A structured roadmap to master arrays and hashing for interviews.', category: 'Placement Preparation', subCategory: 'DSA', fileType: 'external', externalUrl: 'https://neetcode.io/roadmap', uploadedBy: 'alumni1', tags: ['dsa', 'interview'] },
  { title: 'MERN Stack Crash Course (Video)', description: 'Build and deploy a full MERN application — complete walkthrough.', category: 'Development', subCategory: 'MERN', fileType: 'video', externalUrl: 'https://www.youtube.com/watch?v=mrHNSanmqQ4', uploadedBy: 'alumni7', tags: ['mern', 'react', 'node'] },
  { title: 'DBMS Normalization — Unit Notes', description: 'Unit-wise notes on normalization, functional dependencies, and ER models.', category: 'Semester', subCategory: 'Unit-wise notes', fileType: 'external', externalUrl: 'https://www.geeksforgeeks.org/database-normalization-normal-forms/', uploadedBy: 'faculty2', tags: ['dbms', 'semester'] },
  { title: 'Aptitude Practice Set — 200 Questions', description: 'Quantitative aptitude practice with solutions for placement tests.', category: 'Placement Preparation', subCategory: 'Aptitude', fileType: 'external', externalUrl: 'https://www.indiabix.com/aptitude/questions-and-answers/', uploadedBy: 'faculty3', tags: ['aptitude', 'placement'] },
  { title: 'Interview Experience: Amazon SDE', description: 'A detailed Amazon SDE interview experience with questions asked.', category: 'Placement Preparation', subCategory: 'Interview preparation', fileType: 'external', externalUrl: 'https://www.geeksforgeeks.org/amazon-sde-2-interview-experience/', uploadedBy: 'alumni2', tags: ['interview', 'amazon'] },
];

const ANNOUNCEMENT_SEEDS = [
  { title: 'Mid-term examination schedule published', body: 'The mid-term exam timetable is now available on the academic portal. Exams begin in three weeks. Contact the exam cell for schedule conflicts.', category: 'exam', author: 'faculty1', audience: 'all', pinned: true },
  { title: 'Placement drive registrations open', body: 'Registrations for the upcoming placement drive are open until Friday. Update your resumes and attend the prep sessions.', category: 'placement', author: 'faculty1', audience: 'student' },
  { title: 'New scholarship campaign launched', body: 'The Merit Scholarship Fund by the alumni community is now open for applications. Check the Scholarships section for eligibility.', category: 'scholarship', author: 'alumni1', audience: 'all' },
  { title: 'Library timings during the festival week', body: 'The central library will remain open from 8 AM to 8 PM during the festival week.', category: 'notice', author: 'admin', audience: 'all' },
];

const POST_SEEDS = [
  { type: 'achievement', content: 'Thrilled to share that I have been placed at Google as a Senior Software Engineer! Grateful to all the mentors from this community who guided me through the years. Happy to help anyone preparing for interviews — drop a message. 🎉', tags: ['placement', 'google'], author: 'alumni1' },
  { type: 'career_advice', content: 'Tips for cracking system design interviews: 1) Always clarify requirements first. 2) Estimate scale before choosing components. 3) Talk through trade-offs out loud. 4) Practice on whiteboards, not just laptops.', tags: ['system-design', 'interviews'], author: 'alumni2' },
  { type: 'study_tips', content: 'Starting a GATE CS study group — we meet every Saturday at 5 PM in the library. Focus on OS + DBMS this month. All years welcome!', tags: ['gate', 'study-group'], author: 'student1' },
  { type: 'knowledge', content: 'Quick reference: HTTP status codes every developer should know — 200 OK, 201 Created, 301 Moved, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error, 503 Unavailable.', tags: ['web', 'http'], author: 'student4' },
  { type: 'alumni_experience', content: 'My journey from campus to Microsoft: the single biggest difference-maker was mock interviews with seniors. I interviewed 6 alumni for practice before my real loop. Please use this platform to find mentors — we are all happy to help.', tags: ['journey', 'microsoft'], author: 'alumni4' },
  { type: 'opportunity', content: 'My team at CRED is hiring backend engineers (Go). I can refer students from our campus — DM me with your resume and a short intro. 🚀', tags: ['referral', 'cred'], author: 'alumni15' },
];

const COMMENT_SEEDS = [
  { post: 0, author: 'student1', content: 'Congratulations sir! 🎉 Would love a mock interview session if you have time.' },
  { post: 0, author: 'student4', content: 'Massive congratulations! Truly inspiring.' },
  { post: 1, author: 'student2', content: 'Point 4 is so true — whiteboard practice changed my approach completely.' },
  { post: 4, author: 'student3', content: 'How do we find mentors here? Just send a connection request?' },
  { post: 5, author: 'student1', content: 'DM sent! I have 3 years of experience with Node.js.' },
];

const CONNECTION_SEEDS = [
  ['student1', 'alumni1', 'accepted'],
  ['student2', 'alumni1', 'accepted'],
  ['student3', 'alumni4', 'accepted'],
  ['student4', 'alumni2', 'accepted'],
  ['student5', 'alumni5', 'pending'],
  ['faculty1', 'alumni1', 'accepted'],
  ['alumni1', 'alumni2', 'accepted'],
];

const MEETING_SEEDS = [
  { title: 'Mock interview practice — DSA round', organizer: 'alumni1', date: addDays(5), startTime: '18:00', endTime: '19:00', type: 'one_on_one', description: 'Practicing DSA interview questions. Bring your best solutions!', meetingLink: 'https://meet.google.com/mock-dsa', status: 'accepted', participant: 'student1', participantStatus: 'accepted' },
  { title: 'Academic guidance — semester planning', organizer: 'faculty1', date: addDays(7), startTime: '11:30', endTime: '12:15', type: 'one_on_one', description: 'Discussing elective choices and semester planning.', location: 'Faculty cabin, CS Block', status: 'pending', participant: 'student1', participantStatus: 'invited' },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------
async function seed() {
  await connectDB();

  const existingAdmin = await User.findOne({ email: ADMIN.email }).select('_id').lean();
  if (existingAdmin && !force) {
    console.log('⚠️  Seed skipped — data already present. Use `npm run seed -- --force` to reset.');
    await disconnectDB();
    return;
  }

  if (force) {
    const collections = [
      User, StudentProfile, FacultyProfile, AlumniProfile, RefreshToken, AuditLog,
      Event, EventRegistration, Meeting, MeetingParticipant, Scholarship, Donation,
      Payment, Job, Resource, Post, Comment, Like, Announcement, Connection, Notification,
      Conversation, Message, CareerRoadmap,
    ];
    await Promise.all(collections.map((model) => model.deleteMany({})));
    console.log('🧹 Cleared seeded collections');
  }

  const hash = (pw) => bcrypt.hash(pw, 12);
  const [adminHash, facultyHash, alumniHash, studentHash] = await Promise.all([
    hash(PASSWORD_BY_ROLE.admin),
    hash(PASSWORD_BY_ROLE.faculty),
    hash(PASSWORD_BY_ROLE.alumni),
    hash(PASSWORD_BY_ROLE.student),
  ]);

  const userByRef = {}; // "student1" | "alumni1" | "faculty1" | "admin" → user doc

  const createUser = async ({ name, email, passwordHash, role, badges = [], reputation = 0, extra = {} }) => {
    const user = await User.create({ name, email, passwordHash, role, isVerified: true, isApproved: true, badges, reputationScore: reputation, ...extra });
    return user;
  };

  // --- Admin ---
  userByRef.admin = await createUser({ name: ADMIN.name, email: ADMIN.email, passwordHash: adminHash, role: 'admin', badges: ['verified_organizer'], reputation: 5000 });

  // --- Faculty ---
  for (let i = 0; i < FACULTY.length; i += 1) {
    const f = FACULTY[i];
    const user = await createUser({ name: f.name, email: `faculty${i + 1}@campus.edu`, passwordHash: facultyHash, role: 'faculty', badges: ['verified_faculty'], reputation: 200 + i * 50 });
    await FacultyProfile.create({ user: user._id, employeeId: f.employeeId, department: f.department, designation: f.designation, subjects: f.subjects, about: `${f.designation} in the ${f.department} department, passionate about teaching and student mentorship.` });
    userByRef[`faculty${i + 1}`] = user;
  }

  // --- Alumni ---
  for (let i = 0; i < ALUMNI.length; i += 1) {
    const a = ALUMNI[i];
    const user = await createUser({ name: a.name, email: `alumni${i + 1}@campus.edu`, passwordHash: alumniHash, role: 'alumni', badges: ['verified_alumni', ...(a.availableForMentorship ? ['mentor'] : [])], reputation: 150 + i * 25 });
    await AlumniProfile.create({ user: user._id, graduationYear: a.graduationYear, department: a.department, degree: a.degree, currentCompany: a.currentCompany, designation: a.designation, industry: a.industry, skills: a.skills, location: a.location, about: `${a.designation} at ${a.currentCompany}. ${a.department} alumnus of batch ${a.graduationYear}.`, linkedinUrl: `https://linkedin.com/in/${a.name.toLowerCase().replace(/[^a-z]+/g, '-')}`, availableForMentorship: a.availableForMentorship ?? false, mentorshipAreas: a.mentorshipAreas ?? [] });
    userByRef[`alumni${i + 1}`] = user;
  }

  // --- Students ---
  for (let i = 0; i < STUDENTS.length; i += 1) {
    const s = STUDENTS[i];
    const user = await createUser({ name: s.name, email: `student${i + 1}@campus.edu`, passwordHash: studentHash, role: 'student', phone: `+91 9${String(8000000000 + i * 137).slice(0, 9)}`, badges: ['verified_student'], reputation: 20 + i * 5 });
    await StudentProfile.create({ user: user._id, rollNumber: s.rollNumber, department: s.department, course: s.course, year: s.year, graduationYear: s.graduationYear, location: s.location, skills: s.skills, about: `${s.course} student (Year ${s.year}, ${s.department}). Batch of ${s.graduationYear}.` });
    userByRef[`student${i + 1}`] = user;
  }

  // -------------------------------------------------------------------------
  // Events + registrations
  // -------------------------------------------------------------------------
  const eventRefs = {};
  for (let i = 0; i < EVENT_SEEDS.length; i += 1) {
    const e = EVENT_SEEDS[i];
    const event = await Event.create({
      title: e.title,
      description: e.description,
      organizer: userByRef[e.organizer]._id,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      venue: e.venue ?? '',
      mode: e.mode ?? 'offline',
      meetingLink: e.meetingLink ?? '',
      maxParticipants: e.maxParticipants ?? 100,
      department: e.department ?? '',
      category: e.category,
      status: e.status ?? 'published',
    });
    eventRefs[i] = event;
  }
  // Registrations for the hackathon + alumni meet (counts stay consistent)
  const regEvents = [4, 3]; // hackathon, alumni meet
  const regStudents = ['student1', 'student2', 'student3'];
  for (let i = 0; i < regEvents.length; i += 1) {
    const event = eventRefs[regEvents[i]];
    let count = 0;
    for (let s = 0; s < (i === 0 ? 3 : 2); s += 1) {
      const student = userByRef[regStudents[s]];
      await EventRegistration.create({ event: event._id, user: student._id, status: 'registered' });
      count += 1;
    }
    await Event.updateOne({ _id: event._id }, { $set: { registrationsCount: count } });
  }

  // -------------------------------------------------------------------------
  // Meetings + participants
  // -------------------------------------------------------------------------
  for (const m of MEETING_SEEDS) {
    const meeting = await Meeting.create({
      title: m.title,
      organizer: userByRef[m.organizer]._id,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime ?? '',
      type: m.type,
      description: m.description,
      location: m.location ?? '',
      meetingLink: m.meetingLink ?? '',
      status: m.status,
    });
    await MeetingParticipant.create({ meeting: meeting._id, user: userByRef[m.participant]._id, status: m.participantStatus });
  }

  // -------------------------------------------------------------------------
  // Scholarships + donations + payments
  // -------------------------------------------------------------------------
  const scholarshipRefs = [];
  for (const s of SCHOLARSHIP_SEEDS) {
    const scholarship = await Scholarship.create({
      name: s.name,
      description: s.description,
      eligibility: s.eligibility,
      minimumRequirements: s.minimumRequirements,
      maxApplicants: s.maxApplicants,
      amount: s.amount,
      targetAmount: s.targetAmount,
      deadline: s.deadline,
      requiredDocuments: s.requiredDocuments,
      sponsor: userByRef[s.sponsor]._id,
      category: s.category,
    });
    scholarshipRefs.push(scholarship);
  }
  for (let i = 0; i < DONATION_SEEDS.length; i += 1) {
    const d = DONATION_SEEDS[i];
    const scholarship = scholarshipRefs[d.scholarship];
    const donor = userByRef[`alumni${d.donor}`];
    const receiptNumber = `RCP-2026-${String(1000 + i)}`;
    const donation = await Donation.create({
      donor: donor._id,
      scholarship: scholarship._id,
      amount: d.amount,
      orderId: `order_seed_${i}`,
      paymentId: `pay_seed_${i}`,
      signature: 'seed_signature',
      status: 'paid',
      receiptNumber,
      message: d.message ?? '',
    });
    await Payment.create({
      user: donor._id,
      purpose: 'donation',
      referenceId: donation._id,
      amount: d.amount,
      orderId: `order_seed_${i}`,
      paymentId: `pay_seed_${i}`,
      signature: 'seed_signature',
      status: 'paid',
    });
    await Scholarship.updateOne({ _id: scholarship._id }, { $inc: { raisedAmount: d.amount } });
  }

  // -------------------------------------------------------------------------
  // Jobs
  // -------------------------------------------------------------------------
  for (let i = 0; i < JOB_SEEDS.length; i += 1) {
    const j = JOB_SEEDS[i];
    await Job.create({
      title: j.title,
      company: j.company,
      type: j.type,
      description: j.description,
      location: j.location,
      workMode: j.workMode,
      salary: j.salary,
      experience: j.experience,
      skills: j.skills,
      eligibility: j.eligibility ?? '',
      deadline: j.deadline,
      applicationLink: j.applicationLink ?? '',
      applyThroughPlatform: j.applyThroughPlatform ?? false,
      postedBy: userByRef['alumni1']._id,
      status: 'approved',
      isFeatured: i === 0,
    });
  }

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------
  for (const r of RESOURCE_SEEDS) {
    await Resource.create({
      title: r.title,
      description: r.description,
      category: r.category,
      subCategory: r.subCategory,
      fileType: r.fileType,
      externalUrl: r.externalUrl,
      uploadedBy: userByRef[r.uploadedBy]._id,
      status: 'approved',
      tags: r.tags,
    });
  }

  // -------------------------------------------------------------------------
  // Announcements
  // -------------------------------------------------------------------------
  for (const a of ANNOUNCEMENT_SEEDS) {
    await Announcement.create({
      title: a.title,
      body: a.body,
      category: a.category,
      author: userByRef[a.author]._id,
      audience: a.audience,
      pinned: a.pinned ?? false,
    });
  }

  // -------------------------------------------------------------------------
  // Posts + comments + likes
  // -------------------------------------------------------------------------
  const postRefs = [];
  for (let i = 0; i < POST_SEEDS.length; i += 1) {
    const p = POST_SEEDS[i];
    const post = await Post.create({ author: userByRef[p.author]._id, type: p.type, content: p.content, tags: p.tags });
    postRefs.push(post);
  }
  for (let i = 0; i < COMMENT_SEEDS.length; i += 1) {
    const c = COMMENT_SEEDS[i];
    await Comment.create({ post: postRefs[c.post]._id, author: userByRef[c.author]._id, content: c.content });
  }
  // A few likes
  const likePairs = [
    [0, 'student1'], [0, 'student4'], [0, 'student2'],
    [1, 'student2'], [1, 'student3'],
    [4, 'student1'], [4, 'student6'],
    [5, 'student1'], [5, 'student4'],
  ];
  const postLikes = { 0: 3, 1: 2, 4: 2, 5: 2 };
  for (const [postIdx, studentRef] of likePairs) {
    await Like.create({ user: userByRef[studentRef]._id, targetType: 'post', targetId: postRefs[postIdx]._id, targetModel: 'Post' });
  }
  const commentCounts = { 0: 2, 1: 1, 4: 1, 5: 1 };
  for (const [postIdx, count] of Object.entries(commentCounts)) {
    await Post.updateOne({ _id: postRefs[Number(postIdx)]._id }, { $set: { 'counts.likes': postLikes[Number(postIdx)] ?? 0, 'counts.comments': count } });
  }

  // -------------------------------------------------------------------------
  // Connections
  // -------------------------------------------------------------------------
  for (const [fromRef, toRef, status] of CONNECTION_SEEDS) {
    await Connection.create({
      requester: userByRef[fromRef]._id,
      recipient: userByRef[toRef]._id,
      status,
      respondedAt: status === 'accepted' || status === 'pending' ? new Date() : undefined,
    });
  }

  // -------------------------------------------------------------------------
  // Conversations + messages (demo chat)
  // -------------------------------------------------------------------------
  const demoConversation = await Conversation.create({
    type: 'direct',
    participants: [userByRef.student1._id, userByRef.alumni1._id],
  });
  await Message.create({
    conversation: demoConversation._id,
    sender: userByRef.alumni1._id,
    kind: 'text',
    content:
      'Hi Aarav! Welcome to Campus Connect. Happy to help with DSA and interview prep whenever you need it — just reach out here.',
    isRead: true,
    readBy: [userByRef.student1._id],
  });
  const message2 = await Message.create({
    conversation: demoConversation._id,
    sender: userByRef.student1._id,
    kind: 'text',
    content: 'Thank you so much, sir! I will definitely reach out once I start my interview prep.',
  });
  await Conversation.updateOne(
    { _id: demoConversation._id },
    { $set: { lastMessage: message2._id, lastMessageAt: message2.createdAt } },
  );

  // -------------------------------------------------------------------------
  // Career roadmaps
  // -------------------------------------------------------------------------
  for (const roadmap of ROADMAP_SEEDS) {
    await CareerRoadmap.findOneAndUpdate(
      { role: roadmap.role },
      { $set: { title: roadmap.title, description: roadmap.description, steps: roadmap.steps, createdBy: userByRef.admin._id } },
      { upsert: true },
    );
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const totalUsers = await User.countDocuments();
  console.log(`✅ Seeded ${totalUsers} users:`);
  console.log('   • 1 admin · 5 faculty · 15 alumni · 30 students');
  console.log('✅ Seeded content:');
  console.log(`   • ${EVENT_SEEDS.length} events · ${MEETING_SEEDS.length} meetings`);
  console.log(`   • ${SCHOLARSHIP_SEEDS.length} scholarship campaigns · ${DONATION_SEEDS.length} donations`);
  console.log(`   • ${JOB_SEEDS.length} opportunities · ${RESOURCE_SEEDS.length} resources`);
  console.log(`   • ${POST_SEEDS.length} posts · ${ANNOUNCEMENT_SEEDS.length} announcements · ${CONNECTION_SEEDS.length} connections`);
  console.log('   • 1 demo conversation with 2 messages');
  console.log(`   • ${ROADMAP_SEEDS.length} career roadmaps`);
  console.log('');
  console.log('Demo credentials (password by role):');
  console.log(`   admin   → admin@campus.edu        / ${PASSWORD_BY_ROLE.admin}`);
  console.log(`   faculty → faculty1@campus.edu     / ${PASSWORD_BY_ROLE.faculty}`);
  console.log(`   alumni  → alumni1@campus.edu      / ${PASSWORD_BY_ROLE.alumni}`);
  console.log(`   student → student1@campus.edu     / ${PASSWORD_BY_ROLE.student}`);

  await disconnectDB();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
