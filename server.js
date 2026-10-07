const express = require("express");
const db = require("./database");

const app = express();

const PORT = process.env.PORT || 3000;

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
// ADMIN AUTHENTICATION
// ===============================

function requireAdmin(req, res, next) {

    const token = req.headers.authorization;

    if (!adminToken || token !== adminToken) {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }

    next();
}


// ===============================
// ADMIN LOGIN API
// ===============================

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

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

    // Find student
    const student = db.prepare(`
        SELECT *
        FROM students
        WHERE student_id = ?
    `).get(studentId);

    // Check student exists
    if (!student) {

        return res.status(401).json({
            success: false,
            message: "Invalid Student ID or Password"
        });

    }

    // Check password
    if (student.password !== password) {

        return res.status(401).json({
            success: false,
            message: "Invalid Student ID or Password"
        });

    }

    // Login time
    const now = new Date();

    const loginDate = now.toLocaleDateString("en-IN");
    const loginTime = now.toLocaleTimeString("en-IN");

    // Save login history
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

    // Send student details
    res.json({

        success: true,

        message: "Login successful!",

        student: {
            studentId: student.student_id,
            name: student.name,
            branch: student.branch,
            year: student.year,
            section: student.section
        },

        loginDate: loginDate,
        loginTime: loginTime

    });

});


// ===============================
// ADD STUDENT API
// ===============================

app.post("/api/students", requireAdmin, (req, res) => {

    const {
        studentId,
        name,
        branch,
        year,
        section,
        password
    } = req.body;

    // Check required fields
    if (
        !studentId ||
        !name ||
        !branch ||
        !year ||
        !section ||
        !password
    ) {

        return res.status(400).json({
            success: false,
            message: "All student details are required"
        });

    }

    try {

        const insertStudent = db.prepare(`
            INSERT INTO students
            (
                student_id,
                name,
                branch,
                year,
                section,
                password
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertStudent.run(
            studentId,
            name,
            branch,
            year,
            section,
            password
        );

        res.json({
            success: true,
            message: "Student added successfully!"
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {

            return res.status(409).json({
                success: false,
                message: "Student ID already exists"
            });

        }

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add student"
        });

    }

});


// ===============================
// GET ALL STUDENTS
// ===============================

app.get("/api/students", requireAdmin, (req, res) => {

    const students = db.prepare(`
        SELECT
            id,
            student_id,
            name,
            branch,
            year,
            section
        FROM students
        ORDER BY id DESC
    `).all();

    res.json(students);

});


// ===============================
// DELETE STUDENT
// ===============================

app.delete(
    "/api/students/:studentId",
    requireAdmin,
    (req, res) => {

        const { studentId } = req.params;

        const result = db.prepare(`
            DELETE FROM students
            WHERE student_id = ?
        `).run(studentId);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            message: "Student deleted successfully!"
        });

    }
);


// ===============================
// LOGIN HISTORY API
// ===============================

app.get("/api/logins", requireAdmin, (req, res) => {

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

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `BVC Backend running on port ${PORT}`
    );

});