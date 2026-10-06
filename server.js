const express = require("express");
const db = require("./database");

const app = express();

const PORT = 3000;

// JSON data
app.use(express.json());

// Frontend files
app.use(express.static(__dirname));


// ===============================
// ADMIN LOGIN DETAILS
// ===============================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "bvcadmin123";

let adminToken = null;


// ===============================
// ADMIN LOGIN API
// ===============================

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        // Simple session token
        adminToken =
            Date.now().toString() +
            Math.random().toString(36).substring(2);

        return res.json({
            success: true,
            message: "Admin login successful!",
            token: adminToken
        });
    }

    res.status(401).json({
        success: false,
        message: "Invalid admin username or password"
    });

});


// ===============================
// STUDENT LOGIN API
// ===============================

app.post("/login", (req, res) => {

    const { studentId, password } = req.body;

    if (!studentId || !password) {

        return res.status(400).json({
            success: false,
            message: "Student ID and Password are required"
        });

    }

    const now = new Date();

    const loginDate = now.toLocaleDateString("en-IN");
    const loginTime = now.toLocaleTimeString("en-IN");

    const insertLogin = db.prepare(`
        INSERT INTO login_history
        (student_id, login_date, login_time)
        VALUES (?, ?, ?)
    `);

    insertLogin.run(
        studentId,
        loginDate,
        loginTime
    );

    res.json({
        success: true,
        message: "Login recorded successfully!",
        studentId: studentId,
        loginDate: loginDate,
        loginTime: loginTime
    });

});


// ===============================
// LOGIN HISTORY API
// ===============================

app.get("/api/logins", (req, res) => {

    const token = req.headers.authorization;

    // Admin authentication check
    if (!adminToken || token !== adminToken) {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }

    const logins = db.prepare(`
        SELECT *
        FROM login_history
        ORDER BY id DESC
    `).all();

    res.json(logins);

});


// ===============================
// SERVER START
// ===============================

app.listen(PORT, () => {

    console.log(
        `BVC Backend running at http://localhost:${PORT}`
    );

});