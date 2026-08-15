-- ============================================================================
-- Sky APX Medical Coding Academy — Seed Data (MySQL)
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Seed courses (slugs match the canonical course pages already linked site-wide)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO courses (id, slug, title, category, cover_image_url, original_price, offer_price, discount_percentage, modules_count, lessons_count, duration_hours, languages, description, sort_order)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'basic-medical-coding', 'MEDICAL CODING MASTERCLASS', 'Medical Coding', '', '₹9,999', '₹4,999', '50% OFF', '22 Modules', '150+ Lessons', '35+ Hours', 'English & Tamil',
    'Build a strong foundation in Medical Coding through structured lessons covering Medical Terminology, Anatomy & Physiology, ICD-10-CM, CPT®, HCPCS Level II, and Revenue Cycle Management. Learn industry standards, coding guidelines, and documentation practices with practical examples that help you develop job-ready skills. Whether you''re a beginner or a healthcare graduate, this course provides the knowledge needed to start a successful career in medical coding.',
    1),
  ('c0000001-0000-0000-0000-000000000002', 'cpc-fast-track', 'CPC FAST TRACK PROGRAM', 'Medical Coding', '', '₹14,999', '₹6,999', '53% OFF', '18 Modules', '120+ Lessons', '28+ Hours', 'English & Tamil',
    'Accelerate your path to CPC certification with our intensive fast-track program. This course covers all AAPC CPC exam domains with focused instruction, practice exams, and personalized feedback. Designed for motivated learners who want to achieve certification quickly without compromising on quality.',
    2),
  ('c0000001-0000-0000-0000-000000000003', 'aapc-ahima-expert', 'AAPC/AHIMA EXPERT CERTIFICATION', 'Certification', '', '₹18,999', '₹8,999', '52% OFF', '35 Modules', '250+ Lessons', '60+ Hours', 'English & Tamil',
    'Master both AAPC and AHIMA certification tracks with comprehensive coverage of inpatient and outpatient coding, clinical documentation improvement, and compliance. This expert-level program prepares you for multiple industry-recognized certifications and opens doors to advanced career opportunities.',
    3),
  ('c0000001-0000-0000-0000-000000000004', 'ccs-specialization', 'CCS SPECIALIZATION COURSE', 'Certification', '', '₹15,999', '₹7,499', '53% OFF', '25 Modules', '180+ Lessons', '42+ Hours', 'English & Tamil',
    'Specialize in AHIMA''s Certified Coding Specialist credential with in-depth training on ICD-10-CM/PCS, CPT, and HCPCS coding systems. This course emphasizes hospital-based coding, case mix index optimization, and quality reporting requirements for healthcare facilities.',
    4);

-- ---------------------------------------------------------------------------
-- Seed course feedbacks (approved, so they show on the course pages)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO course_feedbacks (id, course_id, name, text, is_approved)
SELECT
  UUID() AS id,
  c.id AS course_id,
  f.name,
  f.text,
  1 AS is_approved
FROM (
  SELECT 'basic-medical-coding' AS slug, 'Ananya R.' AS name, 'The course was easy to follow, practical, and helped me understand medical coding with confidence. The trainers explained every concept clearly.' AS text
  UNION ALL SELECT 'basic-medical-coding', 'Priya M.', 'Excellent curriculum and supportive mentors. I cleared my CPC exam on the first attempt thanks to the mock tests and hands-on practice sessions.'
  UNION ALL SELECT 'basic-medical-coding', 'Vikram S.', 'The structured approach to learning ICD-10 and CPT coding was exactly what I needed. The real-world case studies made all the difference.'
  UNION ALL SELECT 'cpc-fast-track', 'Meera K.', 'I came from a non-medical background but the course made everything simple. The placement support helped me land a job within 2 months.'
  UNION ALL SELECT 'cpc-fast-track', 'Arjun T.', 'The flexibility of the course schedule allowed me to study while working. The trainers were always available for doubt-clearing sessions.'
  UNION ALL SELECT 'aapc-ahima-expert', 'Deepa N.', 'I highly recommend Sky APX for anyone serious about medical coding. The course content is up-to-date with industry standards.'
  UNION ALL SELECT 'aapc-ahima-expert', 'Rohan P.', 'The mock exams were incredibly realistic. I felt fully prepared on exam day. Thank you Sky APX for the amazing training.'
  UNION ALL SELECT 'ccs-specialization', 'Sneha L.', 'From basic terminology to advanced coding, everything was covered thoroughly. The community support is also fantastic.'
) AS f
JOIN courses c ON c.slug = f.slug
WHERE NOT EXISTS (SELECT 1 FROM course_feedbacks WHERE name = f.name);

-- ---------------------------------------------------------------------------
-- Seed a few enquiries so the admin dashboard has live data on first deploy
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO enquiries (id, name, email, phone, subject, message, status)
SELECT UUID(), e.name, e.email, e.phone, e.subject, e.message, e.status
FROM (
  SELECT 'Ananya Rajesh' AS name, 'ananya@email.com' AS email, '+91 98765 43210' AS phone, 'General Inquiry' AS subject, 'I wanted to know more about the medical coding courses and upcoming batch timings.' AS message, 'New' AS status
  UNION ALL SELECT 'Vikram Singh', 'vikram.s@email.com', '+91 87654 32109', 'Course Details', 'Please share the course brochure and fee structure for the CPC Fast Track program.', 'Contacted'
  UNION ALL SELECT 'Priya Mehta', 'priya.m@email.com', '+91 76543 21098', 'General Inquiry', 'Are classes available for working professionals on weekends?', 'Interested'
  UNION ALL SELECT 'Arjun Patel', 'arjun.p@email.com', '+91 65432 10987', 'Bootcamp', 'When does the next bootcamp batch start and what is the duration?', 'Joined'
  UNION ALL SELECT 'Sneha Kumar', 'sneha.k@email.com', '+91 54321 09876', 'General Inquiry', 'Do you offer placement assistance after course completion?', 'Closed'
) AS e
WHERE NOT EXISTS (SELECT 1 FROM enquiries);

-- ---------------------------------------------------------------------------
-- Seed testimonials (homepage success stories)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO testimonials (id, name, designation, text, rating)
SELECT UUID(), t.name, t.designation, t.text, t.rating
FROM (
  SELECT 'James Anderson' AS name, 'Now Certified CCS Professional' AS designation, 'Sky APX completely changed my life. Within 6 months of starting the CCS track, I secured a position at a major city hospital with a 40% salary increase. The mentors are incredible.' AS text, 5.0 AS rating
) AS t
WHERE NOT EXISTS (SELECT 1 FROM testimonials);

-- ---------------------------------------------------------------------------
-- Seed FAQs (homepage FAQ section)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO faqs (id, question, answer, sort_order)
SELECT UUID(), f.question, f.answer, f.sort_order
FROM (
  SELECT 'What is the CPC exam pass rate for students?' AS question, 'Our students maintain a 92% first-time pass rate, which is significantly higher than the national average, thanks to our rigorous mock exam series.' AS answer, 1 AS sort_order
  UNION ALL SELECT 'Do you provide job placement assistance?', 'Yes, we offer dedicated career services including resume reviews, interview coaching, and direct partnerships with healthcare employers.', 2
  UNION ALL SELECT 'Can I study while working full-time?', 'Absolutely. Our flexible schedule includes evening and weekend cohorts designed for working professionals.', 3
  UNION ALL SELECT 'Are the certifications recognized globally?', 'Yes, AAPC and AHIMA certifications are recognized across the United States and internationally in over 50 countries.', 4
) AS f
WHERE NOT EXISTS (SELECT 1 FROM faqs);
