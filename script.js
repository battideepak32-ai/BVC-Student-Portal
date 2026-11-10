
"use strict";

// =====================================
// STUDENT LOGIN
// =====================================

const form = document.querySelector("form");

if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const studentIdInput =
            document.querySelector('input[type="text"]');

        const passwordInput =
            document.querySelector('input[type="password"]');

        if (!studentIdInput || !passwordInput) {
            alert("Login form fields not found.");
            return;
        }

        const studentId = studentIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!studentId || !password) {
            alert("Please enter Student ID and Password.");
            return;
        }

        // Prevent duplicate login requests.
        const submitButton = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            // Send login request to Express backend.
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    studentId: studentId,
                    password: password
                })
            });

            // Check whether the server returned JSON.
            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const responseText = await response.text();

                console.error(
                    "Expected JSON but received HTML/text:",
                    responseText
                );

                alert(
                    "Server returned HTML instead of JSON. " +
                    "Check the website URL and backend API."
                );

                return;
            }

            const data = await response.json();

            // Handle incorrect credentials or server errors.
            if (!response.ok || !data.success) {
                alert(
                    data.error ||
                    data.message ||
                    "Invalid Student ID or Password."
                );
                return;
            }

            const student = data.student;

            if (!student) {
                alert("Student details were not returned by the server.");
                return;
            }

            // Save student details.
            // Backend database columns use snake_case.
            localStorage.setItem(
                "studentId",
                student.student_id || student.studentId || studentId
            );

            localStorage.setItem(
                "studentName",
                student.name || ""
            );

            localStorage.setItem(
                "studentBranch",
                student.branch || ""
            );

            localStorage.setItem(
                "studentYear",
                student.year || ""
            );

            localStorage.setItem(
                "studentSection",
                student.section || ""
            );

            // Save login time on the browser.
            const now = new Date();

            localStorage.setItem(
                "loginDate",
                now.toLocaleDateString()
            );

            localStorage.setItem(
                "loginTime",
                now.toLocaleTimeString()
            );

            alert("Welcome " + (student.name || "Student") + "!");

            // Open student dashboard.
            window.location.href = "/dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            alert(
                "Server connection failed. " +
                "Please check whether the backend is running."
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}


// =====================================
// STUDENT LOGOUT
// =====================================

function logout() {
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentBranch");
    localStorage.removeItem("studentYear");
    localStorage.removeItem("studentSection");
    localStorage.removeItem("loginDate");
    localStorage.removeItem("loginTime");

    alert("You have been logged out!");

    window.location.href = "/index.html";
}