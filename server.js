const express = require("express");
const db = require("./database");

const app = express();

const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());
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

    const student = db.prepare(`
        SELECT *
        FROM students
        WHERE student_id = ?
    `).get(studentId);

    if (!student) {

        return res.status(401).json({
            success: false,
            message: "Invalid Student ID or Password"
        });

    }

    if (student.password !== password) {

        return res.status(401).json({
            success: false,
            message: "Invalid Student ID or Password"
        });

    }

    const now = new Date();

    const loginDate = now.toLocaleDateString("en-IN");
    const loginTime = now.toLocaleTimeString("en-IN");

    db.prepare(`
        INSERT INTO login_history
        (student_id, login_date, login_time)
        VALUES (?, ?, ?)
    `).run(
        studentId,
        loginDate,
        loginTime
    );

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

        loginDate,
        loginTime

    });

});


// ======================================================
// STUDENT MANAGEMENT
// ======================================================


// ===============================
// ADD STUDENT
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

        db.prepare(`
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
        `).run(
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

        console.error("Add student error:", error);

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

    try {

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

    } catch (error) {

        console.error("Get students error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });

    }

});


// ===============================
// DELETE STUDENT
// ===============================

app.delete(
    "/api/students/:studentId",
    requireAdmin,
    (req, res) => {

        const { studentId } = req.params;

        try {

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

        } catch (error) {

            console.error("Delete student error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to delete student"
            });

        }

    }
);


// ======================================================
// SUBJECTS MANAGEMENT
// ======================================================


// ===============================
// ADD SUBJECT
// ===============================

app.post("/api/subjects", requireAdmin, (req, res) => {

    const {
        studentId,
        subjectCode,
        subjectName,
        faculty
    } = req.body;

    if (
        !studentId ||
        !subjectCode ||
        !subjectName
    ) {

        return res.status(400).json({
            success: false,
            message: "Student ID, Subject Code and Subject Name are required"
        });

    }

    try {

        const student = db.prepare(`
            SELECT student_id
            FROM students
            WHERE student_id = ?
        `).get(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        db.prepare(`
            INSERT INTO subjects
            (
                student_id,
                subject_code,
                subject_name,
                faculty
            )
            VALUES (?, ?, ?, ?)
        `).run(
            studentId,
            subjectCode,
            subjectName,
            faculty || ""
        );

        res.json({
            success: true,
            message: "Subject added successfully!"
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {

            return res.status(409).json({
                success: false,
                message: "This subject already exists for this student"
            });

        }

        console.error("Add subject error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add subject"
        });

    }

});


// ===============================
// GET ALL SUBJECTS - ADMIN
// ===============================

app.get("/api/subjects", requireAdmin, (req, res) => {

    try {

        const subjects = db.prepare(`
            SELECT
                subjects.id,
                subjects.student_id,
                students.name AS student_name,
                subjects.subject_code,
                subjects.subject_name,
                subjects.faculty
            FROM subjects
            LEFT JOIN students
                ON subjects.student_id = students.student_id
            ORDER BY subjects.id DESC
        `).all();

        res.json(subjects);

    } catch (error) {

        console.error("Get subjects error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch subjects"
        });

    }

});


// ===============================
// GET SUBJECTS BY STUDENT
// ===============================

app.get("/api/subjects/:studentId", (req, res) => {

    try {

        const subjects = db.prepare(`
            SELECT
                id,
                student_id,
                subject_code,
                subject_name,
                faculty
            FROM subjects
            WHERE student_id = ?
            ORDER BY id DESC
        `).all(req.params.studentId);

        res.json(subjects);

    } catch (error) {

        console.error("Student subjects error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch subjects"
        });

    }

});


// ===============================
// UPDATE SUBJECT
// ===============================

app.put("/api/subjects/:id", requireAdmin, (req, res) => {

    const {
        subjectCode,
        subjectName,
        faculty
    } = req.body;

    try {

        const result = db.prepare(`
            UPDATE subjects
            SET
                subject_code = ?,
                subject_name = ?,
                faculty = ?
            WHERE id = ?
        `).run(
            subjectCode,
            subjectName,
            faculty || "",
            req.params.id
        );

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });

        }

        res.json({
            success: true,
            message: "Subject updated successfully!"
        });

    } catch (error) {

        console.error("Update subject error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update subject"
        });

    }

});


// ===============================
// DELETE SUBJECT
// ===============================

app.delete("/api/subjects/:id", requireAdmin, (req, res) => {

    try {

        const result = db.prepare(`
            DELETE FROM subjects
            WHERE id = ?
        `).run(req.params.id);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });

        }

        res.json({
            success: true,
            message: "Subject deleted successfully!"
        });

    } catch (error) {

        console.error("Delete subject error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete subject"
        });

    }

});


// ======================================================
// ATTENDANCE MANAGEMENT
// ======================================================


// ===============================
// ADD ATTENDANCE
// ===============================

app.post("/api/attendance", requireAdmin, (req, res) => {

    const {
        studentId,
        subjectCode,
        subjectName,
        totalClasses,
        attendedClasses
    } = req.body;

    if (
        !studentId ||
        !subjectCode ||
        !subjectName ||
        totalClasses === undefined ||
        attendedClasses === undefined
    ) {

        return res.status(400).json({
            success: false,
            message: "All attendance details are required"
        });

    }

    if (
        Number(totalClasses) < 0 ||
        Number(attendedClasses) < 0 ||
        Number(attendedClasses) > Number(totalClasses)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid attendance values"
        });

    }

    try {

        const student = db.prepare(`
            SELECT student_id
            FROM students
            WHERE student_id = ?
        `).get(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        db.prepare(`
            INSERT INTO attendance
            (
                student_id,
                subject_code,
                subject_name,
                total_classes,
                attended_classes
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            studentId,
            subjectCode,
            subjectName,
            Number(totalClasses),
            Number(attendedClasses)
        );

        res.json({
            success: true,
            message: "Attendance added successfully!"
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {

            return res.status(409).json({
                success: false,
                message: "Attendance for this subject already exists"
            });

        }

        console.error("Add attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add attendance"
        });

    }

});


// ===============================
// GET ALL ATTENDANCE - ADMIN
// ===============================

app.get("/api/attendance", requireAdmin, (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                attendance.id,
                attendance.student_id,
                students.name AS student_name,
                attendance.subject_code,
                attendance.subject_name,
                attendance.total_classes,
                attendance.attended_classes
            FROM attendance
            LEFT JOIN students
                ON attendance.student_id = students.student_id
            ORDER BY attendance.id DESC
        `).all();

        res.json(records);

    } catch (error) {

        console.error("Get attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance"
        });

    }

});


// ===============================
// GET ATTENDANCE BY STUDENT
// ===============================

app.get("/api/attendance/:studentId", (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                id,
                student_id,
                subject_code,
                subject_name,
                total_classes,
                attended_classes
            FROM attendance
            WHERE student_id = ?
            ORDER BY id DESC
        `).all(req.params.studentId);

        res.json(records);

    } catch (error) {

        console.error("Student attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance"
        });

    }

});


// ===============================
// UPDATE ATTENDANCE
// ===============================

app.put("/api/attendance/:id", requireAdmin, (req, res) => {

    const {
        subjectCode,
        subjectName,
        totalClasses,
        attendedClasses
    } = req.body;

    if (
        Number(totalClasses) < 0 ||
        Number(attendedClasses) < 0 ||
        Number(attendedClasses) > Number(totalClasses)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid attendance values"
        });

    }

    try {

        const result = db.prepare(`
            UPDATE attendance
            SET
                subject_code = ?,
                subject_name = ?,
                total_classes = ?,
                attended_classes = ?
            WHERE id = ?
        `).run(
            subjectCode,
            subjectName,
            Number(totalClasses),
            Number(attendedClasses),
            req.params.id
        );

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });

        }

        res.json({
            success: true,
            message: "Attendance updated successfully!"
        });

    } catch (error) {

        console.error("Update attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update attendance"
        });

    }

});


// ===============================
// DELETE ATTENDANCE
// ===============================

app.delete("/api/attendance/:id", requireAdmin, (req, res) => {

    try {

        const result = db.prepare(`
            DELETE FROM attendance
            WHERE id = ?
        `).run(req.params.id);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });

        }

        res.json({
            success: true,
            message: "Attendance deleted successfully!"
        });

    } catch (error) {

        console.error("Delete attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete attendance"
        });

    }

});


// ======================================================
// RESULTS MANAGEMENT
// ======================================================


// ===============================
// ADD RESULT
// ===============================

app.post("/api/results", requireAdmin, (req, res) => {

    const {
        studentId,
        subjectCode,
        subjectName,
        marks,
        maxMarks,
        grade
    } = req.body;

    if (
        !studentId ||
        !subjectCode ||
        !subjectName ||
        marks === undefined
    ) {

        return res.status(400).json({
            success: false,
            message: "Student, subject and marks are required"
        });

    }

    const maximum = maxMarks === undefined ? 100 : Number(maxMarks);
    const obtained = Number(marks);

    if (
        obtained < 0 ||
        maximum <= 0 ||
        obtained > maximum
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid marks"
        });

    }

    try {

        const student = db.prepare(`
            SELECT student_id
            FROM students
            WHERE student_id = ?
        `).get(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        db.prepare(`
            INSERT INTO results
            (
                student_id,
                subject_code,
                subject_name,
                marks,
                max_marks,
                grade
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            studentId,
            subjectCode,
            subjectName,
            obtained,
            maximum,
            grade || ""
        );

        res.json({
            success: true,
            message: "Result added successfully!"
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {

            return res.status(409).json({
                success: false,
                message: "Result for this subject already exists"
            });

        }

        console.error("Add result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add result"
        });

    }

});


// ===============================
// GET ALL RESULTS - ADMIN
// ===============================

app.get("/api/results", requireAdmin, (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                results.id,
                results.student_id,
                students.name AS student_name,
                results.subject_code,
                results.subject_name,
                results.marks,
                results.max_marks,
                results.grade
            FROM results
            LEFT JOIN students
                ON results.student_id = students.student_id
            ORDER BY results.id DESC
        `).all();

        res.json(records);

    } catch (error) {

        console.error("Get results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch results"
        });

    }

});


// ===============================
// GET RESULTS BY STUDENT
// ===============================

app.get("/api/results/:studentId", (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                id,
                student_id,
                subject_code,
                subject_name,
                marks,
                max_marks,
                grade
            FROM results
            WHERE student_id = ?
            ORDER BY id DESC
        `).all(req.params.studentId);

        res.json(records);

    } catch (error) {

        console.error("Student results error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch results"
        });

    }

});


// ===============================
// UPDATE RESULT
// ===============================

app.put("/api/results/:id", requireAdmin, (req, res) => {

    const {
        subjectCode,
        subjectName,
        marks,
        maxMarks,
        grade
    } = req.body;

    const maximum = maxMarks === undefined ? 100 : Number(maxMarks);
    const obtained = Number(marks);

    if (
        obtained < 0 ||
        maximum <= 0 ||
        obtained > maximum
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid marks"
        });

    }

    try {

        const result = db.prepare(`
            UPDATE results
            SET
                subject_code = ?,
                subject_name = ?,
                marks = ?,
                max_marks = ?,
                grade = ?
            WHERE id = ?
        `).run(
            subjectCode,
            subjectName,
            obtained,
            maximum,
            grade || "",
            req.params.id
        );

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Result not found"
            });

        }

        res.json({
            success: true,
            message: "Result updated successfully!"
        });

    } catch (error) {

        console.error("Update result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update result"
        });

    }

});


// ===============================
// DELETE RESULT
// ===============================

app.delete("/api/results/:id", requireAdmin, (req, res) => {

    try {

        const result = db.prepare(`
            DELETE FROM results
            WHERE id = ?
        `).run(req.params.id);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Result not found"
            });

        }

        res.json({
            success: true,
            message: "Result deleted successfully!"
        });

    } catch (error) {

        console.error("Delete result error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete result"
        });

    }

});


// ======================================================
// TIMETABLE MANAGEMENT
// ======================================================


// ===============================
// ADD TIMETABLE
// ===============================

app.post("/api/timetable", requireAdmin, (req, res) => {

    const {
        studentId,
        day,
        startTime,
        endTime,
        subjectCode,
        subjectName,
        faculty,
        room
    } = req.body;

    if (
        !studentId ||
        !day ||
        !startTime ||
        !endTime ||
        !subjectCode ||
        !subjectName
    ) {

        return res.status(400).json({
            success: false,
            message: "Required timetable details are missing"
        });

    }

    try {

        const student = db.prepare(`
            SELECT student_id
            FROM students
            WHERE student_id = ?
        `).get(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        db.prepare(`
            INSERT INTO timetable
            (
                student_id,
                day,
                start_time,
                end_time,
                subject_code,
                subject_name,
                faculty,
                room
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            studentId,
            day,
            startTime,
            endTime,
            subjectCode,
            subjectName,
            faculty || "",
            room || ""
        );

        res.json({
            success: true,
            message: "Timetable added successfully!"
        });

    } catch (error) {

        console.error("Add timetable error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add timetable"
        });

    }

});


// ===============================
// GET ALL TIMETABLE - ADMIN
// ===============================

app.get("/api/timetable", requireAdmin, (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                timetable.id,
                timetable.student_id,
                students.name AS student_name,
                timetable.day,
                timetable.start_time,
                timetable.end_time,
                timetable.subject_code,
                timetable.subject_name,
                timetable.faculty,
                timetable.room
            FROM timetable
            LEFT JOIN students
                ON timetable.student_id = students.student_id
            ORDER BY
                timetable.id DESC
        `).all();

        res.json(records);

    } catch (error) {

        console.error("Get timetable error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch timetable"
        });

    }

});


// ===============================
// GET TIMETABLE BY STUDENT
// ===============================

app.get("/api/timetable/:studentId", (req, res) => {

    try {

        const records = db.prepare(`
            SELECT
                id,
                student_id,
                day,
                start_time,
                end_time,
                subject_code,
                subject_name,
                faculty,
                room
            FROM timetable
            WHERE student_id = ?
            ORDER BY id ASC
        `).all(req.params.studentId);

        res.json(records);

    } catch (error) {

        console.error("Student timetable error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch timetable"
        });

    }

});


// ===============================
// UPDATE TIMETABLE
// ===============================

app.put("/api/timetable/:id", requireAdmin, (req, res) => {

    const {
        day,
        startTime,
        endTime,
        subjectCode,
        subjectName,
        faculty,
        room
    } = req.body;

    try {

        const result = db.prepare(`
            UPDATE timetable
            SET
                day = ?,
                start_time = ?,
                end_time = ?,
                subject_code = ?,
                subject_name = ?,
                faculty = ?,
                room = ?
            WHERE id = ?
        `).run(
            day,
            startTime,
            endTime,
            subjectCode,
            subjectName,
            faculty || "",
            room || "",
            req.params.id
        );

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Timetable record not found"
            });

        }

        res.json({
            success: true,
            message: "Timetable updated successfully!"
        });

    } catch (error) {

        console.error("Update timetable error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update timetable"
        });

    }

});


// ===============================
// DELETE TIMETABLE
// ===============================

app.delete("/api/timetable/:id", requireAdmin, (req, res) => {

    try {

        const result = db.prepare(`
            DELETE FROM timetable
            WHERE id = ?
        `).run(req.params.id);

        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Timetable record not found"
            });

        }

        res.json({
            success: true,
            message: "Timetable deleted successfully!"
        });

    } catch (error) {

        console.error("Delete timetable error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete timetable"
        });

    }

});


// ======================================================
// LOGIN HISTORY
// ======================================================


// ===============================
// GET LOGIN HISTORY
// ===============================

app.get("/api/logins", requireAdmin, (req, res) => {

    try {

        const logins = db.prepare(`
            SELECT *
            FROM login_history
            ORDER BY id DESC
        `).all();

        res.json(logins);

    } catch (error) {

        console.error("Get login history error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch login history"
        });

    }

});


// ======================================================
// SERVER START
// ======================================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `BVC Backend running on port ${PORT}`
    );

});