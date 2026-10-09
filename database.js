const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "login_history.json");

function getLogins() {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        return [];
    }
}

function saveLogin(studentId) {
    const logins = getLogins();

    const now = new Date();

    logins.push({
        id: logins.length + 1,
        student_id: studentId,
        login_date: now.toLocaleDateString("en-IN"),
        login_time: now.toLocaleTimeString("en-IN")
    });

    fs.writeFileSync(
        filePath,
        JSON.stringify(logins, null, 2)
    );
}

module.exports = {
    getLogins,
    saveLogin
};