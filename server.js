const express = require("express");
const db = require("./database");

const app = express();

const PORT = 3000;

app.use(express.json());

app.use(express.static(__dirname));


// ===============================
// ADMIN LOGIN
// ===============================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "bvcadmin123";

let adminToken = null;


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
// STUDENT LOGIN
// ===============================

app.post("/login", (req, res) => {

    const { studentId, password } = req.body;

    if (!studentId || !password) {

        return res.status(400).json({
            success: false,
            message: "Student ID and Password are required"
        });

    }

    // Login record save
    db.saveLogin(studentId);

    const logins = db.getLogins();

    const latestLogin = logins[logins.length - 1];

    res.json({

        success: true,

        message: "Login recorded successfully!",

        studentId: studentId,

        loginDate: latestLogin.login_date,

        loginTime: latestLogin.login_time

    });

});


// ===============================
// LOGIN HISTORY
// ===============================

app.get("/api/logins", (req, res) => {

    const token = req.headers.authorization;

    if (!adminToken || token !== adminToken) {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }

    const logins = db.getLogins();

    // Newest login first
    logins.reverse();

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