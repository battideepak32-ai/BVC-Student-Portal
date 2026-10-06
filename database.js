const Database = require("better-sqlite3");

const db = new Database("bvc_portal.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        login_date TEXT NOT NULL,
        login_time TEXT NOT NULL
    )
`).run();

console.log("BVC Database connected successfully!");

module.exports = db;