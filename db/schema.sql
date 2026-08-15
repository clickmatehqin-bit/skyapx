-- ============================================================================
-- Sky APX Medical Coding Academy — Database Schema
-- Target: MySQL 8.0+
-- Apply via: `npm run db:setup`
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Admins (login accounts for the /admin dashboard)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            CHAR(36) PRIMARY KEY,
  name          TEXT NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions   VARCHAR(500) NOT NULL DEFAULT 'enquiries,courses,users,notifications,profile',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Admin sessions (server-side tokens, cookie value = token)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         CHAR(36) PRIMARY KEY,
  admin_id   CHAR(36) NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions (token);
CREATE INDEX idx_admin_sessions_admin ON admin_sessions (admin_id);

-- ---------------------------------------------------------------------------
-- Enquiries (submissions from the public "Contact" page)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id         CHAR(36) PRIMARY KEY,
  ref_no     BIGINT NOT NULL UNIQUE AUTO_INCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     VARCHAR(50) NOT NULL DEFAULT 'New',
  notes      TEXT NOT NULL DEFAULT (''),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_created_at (created_at),
  INDEX idx_enquiries_status (status)
);

-- ---------------------------------------------------------------------------
-- Courses (published curriculum shown on course detail pages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id                   CHAR(36) PRIMARY KEY,
  slug                 VARCHAR(255) NOT NULL UNIQUE,
  title                TEXT NOT NULL,
  category             VARCHAR(255) NOT NULL DEFAULT 'Medical Coding',
  cover_image_url      MEDIUMTEXT NOT NULL,
  original_price       VARCHAR(50) NOT NULL DEFAULT '',
  offer_price          VARCHAR(50) NOT NULL DEFAULT '',
  discount_percentage  VARCHAR(50) NOT NULL DEFAULT '',
  modules_count        VARCHAR(50) NOT NULL DEFAULT '0',
  lessons_count        VARCHAR(50) NOT NULL DEFAULT '0',
  duration_hours       VARCHAR(50) NOT NULL DEFAULT '0',
  languages            VARCHAR(255) NOT NULL DEFAULT 'English',
  description          LONGTEXT NOT NULL,
  is_published         TINYINT(1) NOT NULL DEFAULT 1,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_slug (slug(191)),
  INDEX idx_courses_published (is_published)
);

-- ---------------------------------------------------------------------------
-- Course feedbacks (public reviews submitted on course detail pages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_feedbacks (
  id         CHAR(36) PRIMARY KEY,
  course_id  CHAR(36) NOT NULL,
  name       TEXT NOT NULL,
  text       TEXT NOT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course_feedbacks_course (course_id, created_at)
);

-- ---------------------------------------------------------------------------
-- Newsletter subscribers (footer + course page banner signups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         CHAR(36) PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_newsletter_email (email(191))
);

-- ---------------------------------------------------------------------------
-- Testimonials (success stories shown on the homepage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id          CHAR(36) PRIMARY KEY,
  name        TEXT NOT NULL,
  designation VARCHAR(500) NOT NULL DEFAULT '',
  text        TEXT NOT NULL,
  rating      DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- FAQs (displayed on the homepage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
  id         CHAR(36) PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Site settings (key-value store for hero stats, contact details, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  `key`      VARCHAR(255) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO site_settings (`key`, value) VALUES
  ('partnerships', '100+'),
  ('alumni', '10K+'),
  ('reviews_count', '5K+'),
  ('rating', '4.6'),
  ('students_started', '10K+'),
  ('contact_phone', '+91 00000 00000'),
  ('contact_email', 'Medicode.com'),
  ('contact_address', 'Chennai');
