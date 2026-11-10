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
// ADMIN AUTHENTICATION
// ===============================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "bvcadmin123";

let adminToken = null;


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        adminToken =
            "admin-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2);

        return res.json({
            success: true,
            token: adminToken
        });
    }

    res.status(401).json({
        success: false,
        error: "Invalid admin username or password"
    });
});


// ===============================
// ADMIN AUTH MIDDLEWARE
// ===============================

function requireAdmin(req, res, next) {

    const token = req.headers.authorization;

    if (!token || token !== adminToken) {

        return res.status(403).json({
            error: "Unauthorized"
        });
    }

    next();
}


// ===============================
// STUDENT LOGIN
// ===============================

app.post("/login", (req, res) => {

    const { studentId, password } = req.body;

    if (!studentId || !password) {

        return res.status(400).json({
            success: false,
            error: "Student ID and password are required"
        });
    }

    const sql = `
        SELECT *
        FROM students
        WHERE student_id = ?
        AND password = ?
    `;

    db.get(
        sql,
        [studentId, password],
        (err, student) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    error: "Database error"
                });
            }

            if (!student) {

                return res.status(401).json({
                    success: false,
                    error: "Invalid Student ID or Password"
                });
            }


            // ===============================
            // SAVE LOGIN HISTORY
            // ===============================

            const loginSql = `
                INSERT INTO login_history
                (student_id, login_date, login_time)
                VALUES (?, date('now'), time('now'))
            `;

            db.run(
                loginSql,
                [studentId],
                (loginErr) => {

                    if (loginErr) {
                        console.error(
                            "Login history error:",
                            loginErr
                        );
                    }

                    res.json({
                        success: true,
                        student: student
                    });
                }
            );
        }
    );
});


// ======================================================
// STUDENTS
// ======================================================


// GET ALL STUDENTS

app.get(
    "/api/students",
    requireAdmin,
    (req, res) => {

        db.all(
            `SELECT id, student_id, name, branch, year, section
             FROM students
             ORDER BY id DESC`,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ADD STUDENT

app.post(
    "/api/students",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            name,
            branch,
            year,
            section,
            password
        } = req.body;


        if (
            !student_id ||
            !name ||
            !branch ||
            !year ||
            !section ||
            !password
        ) {

            return res.status(400).json({
                error: "All fields are required"
            });
        }


        const sql = `
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
        `;


        db.run(
            sql,
            [
                student_id,
                name,
                branch,
                year,
                section,
                password
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(400).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    id: this.lastID
                });
            }
        );
    }
);


// DELETE STUDENT

app.delete(
    "/api/students/:studentId",
    requireAdmin,
    (req, res) => {

        const { studentId } = req.params;

        db.run(
            `DELETE FROM students
             WHERE student_id = ?`,
            [studentId],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json({
                    success: true,
                    deleted: this.changes
                });
            }
        );
    }
);


// ======================================================
// SUBJECTS
// ======================================================


// GET ALL SUBJECTS

app.get(
    "/api/subjects",
    requireAdmin,
    (req, res) => {

        const sql = `
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
        `;


        db.all(
            sql,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// GET SUBJECTS FOR STUDENT

app.get(
    "/api/subjects/:studentId",
    (req, res) => {

        const { studentId } = req.params;

        db.all(
            `SELECT *
             FROM subjects
             WHERE student_id = ?
             ORDER BY id DESC`,
            [studentId],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ADD SUBJECT

app.post(
    "/api/subjects",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            subject_code,
            subject_name,
            faculty
        } = req.body;


        const sql = `
            INSERT INTO subjects
            (
                student_id,
                subject_code,
                subject_name,
                faculty
            )
            VALUES (?, ?, ?, ?)
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                faculty
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(400).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    id: this.lastID
                });
            }
        );
    }
);


// UPDATE SUBJECT

app.put(
    "/api/subjects/:id",
    requireAdmin,
    (req, res) => {

        const { id } = req.params;

        const {
            student_id,
            subject_code,
            subject_name,
            faculty
        } = req.body;


        const sql = `
            UPDATE subjects
            SET
                student_id = ?,
                subject_code = ?,
                subject_name = ?,
                faculty = ?
            WHERE id = ?
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                faculty,
                id
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    updated: this.changes
                });
            }
        );
    }
);


// DELETE SUBJECT

app.delete(
    "/api/subjects/:id",
    requireAdmin,
    (req, res) => {

        db.run(
            `DELETE FROM subjects
             WHERE id = ?`,
            [req.params.id],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }


                res.json({
                    success: true,
                    deleted: this.changes
                });
            }
        );
    }
);


// ======================================================
// ATTENDANCE
// ======================================================


// GET ALL ATTENDANCE

app.get(
    "/api/attendance",
    requireAdmin,
    (req, res) => {

        const sql = `
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
        `;


        db.all(
            sql,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// GET ATTENDANCE FOR STUDENT

app.get(
    "/api/attendance/:studentId",
    (req, res) => {

        db.all(
            `SELECT *
             FROM attendance
             WHERE student_id = ?
             ORDER BY id DESC`,
            [req.params.studentId],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ADD ATTENDANCE

app.post(
    "/api/attendance",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            subject_code,
            subject_name,
            total_classes,
            attended_classes
        } = req.body;


        const sql = `
            INSERT INTO attendance
            (
                student_id,
                subject_code,
                subject_name,
                total_classes,
                attended_classes
            )
            VALUES (?, ?, ?, ?, ?)
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                total_classes,
                attended_classes
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(400).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    id: this.lastID
                });
            }
        );
    }
);


// UPDATE ATTENDANCE

app.put(
    "/api/attendance/:id",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            subject_code,
            subject_name,
            total_classes,
            attended_classes
        } = req.body;


        const sql = `
            UPDATE attendance
            SET
                student_id = ?,
                subject_code = ?,
                subject_name = ?,
                total_classes = ?,
                attended_classes = ?
            WHERE id = ?
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                total_classes,
                attended_classes,
                req.params.id
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    updated: this.changes
                });
            }
        );
    }
);


// DELETE ATTENDANCE

app.delete(
    "/api/attendance/:id",
    requireAdmin,
    (req, res) => {

        db.run(
            `DELETE FROM attendance
             WHERE id = ?`,
            [req.params.id],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }


                res.json({
                    success: true,
                    deleted: this.changes
                });
            }
        );
    }
);


// ======================================================
// RESULTS
// ======================================================


// GET ALL RESULTS

app.get(
    "/api/results",
    requireAdmin,
    (req, res) => {

        const sql = `
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
        `;


        db.all(
            sql,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// GET RESULTS FOR STUDENT

app.get(
    "/api/results/:studentId",
    (req, res) => {

        db.all(
            `SELECT *
             FROM results
             WHERE student_id = ?
             ORDER BY id DESC`,
            [req.params.studentId],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ADD RESULT

app.post(
    "/api/results",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            subject_code,
            subject_name,
            marks,
            max_marks,
            grade
        } = req.body;


        const sql = `
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
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                marks,
                max_marks,
                grade
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(400).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    id: this.lastID
                });
            }
        );
    }
);


// UPDATE RESULT

app.put(
    "/api/results/:id",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            subject_code,
            subject_name,
            marks,
            max_marks,
            grade
        } = req.body;


        const sql = `
            UPDATE results
            SET
                student_id = ?,
                subject_code = ?,
                subject_name = ?,
                marks = ?,
                max_marks = ?,
                grade = ?
            WHERE id = ?
        `;


        db.run(
            sql,
            [
                student_id,
                subject_code,
                subject_name,
                marks,
                max_marks,
                grade,
                req.params.id
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    updated: this.changes
                });
            }
        );
    }
);


// DELETE RESULT

app.delete(
    "/api/results/:id",
    requireAdmin,
    (req, res) => {

        db.run(
            `DELETE FROM results
             WHERE id = ?`,
            [req.params.id],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }


                res.json({
                    success: true,
                    deleted: this.changes
                });
            }
        );
    }
);


// ======================================================
// TIMETABLE
// ======================================================


// GET ALL TIMETABLE

app.get(
    "/api/timetable",
    requireAdmin,
    (req, res) => {

        const sql = `
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
            ORDER BY timetable.id DESC
        `;


        db.all(
            sql,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// GET TIMETABLE FOR STUDENT

app.get(
    "/api/timetable/:studentId",
    (req, res) => {

        db.all(
            `SELECT *
             FROM timetable
             WHERE student_id = ?
             ORDER BY id DESC`,
            [req.params.studentId],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ADD TIMETABLE

app.post(
    "/api/timetable",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            day,
            start_time,
            end_time,
            subject_code,
            subject_name,
            faculty,
            room
        } = req.body;


        const sql = `
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
        `;


        db.run(
            sql,
            [
                student_id,
                day,
                start_time,
                end_time,
                subject_code,
                subject_name,
                faculty,
                room
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(400).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    id: this.lastID
                });
            }
        );
    }
);


// UPDATE TIMETABLE

app.put(
    "/api/timetable/:id",
    requireAdmin,
    (req, res) => {

        const {
            student_id,
            day,
            start_time,
            end_time,
            subject_code,
            subject_name,
            faculty,
            room
        } = req.body;


        const sql = `
            UPDATE timetable
            SET
                student_id = ?,
                day = ?,
                start_time = ?,
                end_time = ?,
                subject_code = ?,
                subject_name = ?,
                faculty = ?,
                room = ?
            WHERE id = ?
        `;


        db.run(
            sql,
            [
                student_id,
                day,
                start_time,
                end_time,
                subject_code,
                subject_name,
                faculty,
                room,
                req.params.id
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: err.message
                    });
                }


                res.json({
                    success: true,
                    updated: this.changes
                });
            }
        );
    }
);


// DELETE TIMETABLE

app.delete(
    "/api/timetable/:id",
    requireAdmin,
    (req, res) => {

        db.run(
            `DELETE FROM timetable
             WHERE id = ?`,
            [req.params.id],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }


                res.json({
                    success: true,
                    deleted: this.changes
                });
            }
        );
    }
);


// ======================================================
// LOGIN HISTORY
// ======================================================

app.get(
    "/api/logins",
    requireAdmin,
    (req, res) => {

        db.all(
            `SELECT
                id,
                student_id,
                login_date,
                login_time
             FROM login_history
             ORDER BY id DESC`,
            [],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(rows);
            }
        );
    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});