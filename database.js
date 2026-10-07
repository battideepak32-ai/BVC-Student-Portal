const Database = require("better-sqlite3");

const db = new Database("bvc_portal.db");

// Enable foreign keys
db.pragma("foreign_keys = ON");

// ===============================
// STUDENTS TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        branch TEXT NOT NULL,
        year TEXT NOT NULL,
        section TEXT NOT NULL,
        password TEXT NOT NULL
    )
`).run();


// ===============================
// LOGIN HISTORY TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        login_date TEXT NOT NULL,
        login_time TEXT NOT NULL
    )
`).run();


// ===============================
// SUBJECTS TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT NOT NULL,

        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        faculty TEXT DEFAULT '',

        UNIQUE(student_id, subject_code),

        FOREIGN KEY(student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
    )
`).run();


// ===============================
// ATTENDANCE TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT NOT NULL,

        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,

        total_classes INTEGER NOT NULL DEFAULT 0,
        attended_classes INTEGER NOT NULL DEFAULT 0,

        UNIQUE(student_id, subject_code),

        FOREIGN KEY(student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
    )
`).run();


// ===============================
// RESULTS TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT NOT NULL,

        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,

        marks INTEGER NOT NULL DEFAULT 0,
        max_marks INTEGER NOT NULL DEFAULT 100,
        grade TEXT DEFAULT '',

        UNIQUE(student_id, subject_code),

        FOREIGN KEY(student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
    )
`).run();


// ===============================
// TIMETABLE TABLE
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id TEXT NOT NULL,

        day TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,

        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,

        faculty TEXT DEFAULT '',
        room TEXT DEFAULT '',

        FOREIGN KEY(student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
    )
`).run();


console.log("BVC Database connected successfully!");

module.exports = db;