CREATE DATABASE IF NOT EXISTS student_planner;
USE student_planner;

CREATE TABLE IF NOT EXISTS users (
    user_id       INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    course_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    term        VARCHAR(30),
    colour_tag  VARCHAR(20) DEFAULT 'tag-blue',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
    assignment_id    INT PRIMARY KEY AUTO_INCREMENT,
    course_id        INT NOT NULL,
    title            VARCHAR(120) NOT NULL,
    description      TEXT,
    due_date         DATE,
    status           VARCHAR(20) DEFAULT 'To Do',
    progress_percent INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checklist_items (
    item_id       INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    item_text     VARCHAR(255) NOT NULL,
    is_completed  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE
);
