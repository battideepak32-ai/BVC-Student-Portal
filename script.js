const form = document.querySelector("form");


// ===============================
// STUDENT LOGIN
// ===============================

if (form) {

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const studentId =
            document
                .querySelector('input[type="text"]')
                .value
                .trim();

        const password =
            document
                .querySelector('input[type="password"]')
                .value
                .trim();


        // ===============================
        // EMPTY FIELD CHECK
        // ===============================

        if (!studentId || !password) {

            alert(
                "Please enter Student ID and Password"
            );

            return;
        }


        try {

            // ===============================
            // LOGIN REQUEST
            // ===============================

            const response = await fetch(
                "/login",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        studentId:
                            studentId,

                        password:
                            password

                    })

                }
            );


            const data =
                await response.json();


            // ===============================
            // LOGIN SUCCESS
            // ===============================

            if (data.success) {

                const student =
                    data.student;


                // ===============================
                // SAVE STUDENT DETAILS
                // ===============================

                localStorage.setItem(
                    "studentId",
                    student.studentId
                );


                localStorage.setItem(
                    "studentName",
                    student.name
                );


                localStorage.setItem(
                    "studentBranch",
                    student.branch
                );


                localStorage.setItem(
                    "studentYear",
                    student.year
                );


                localStorage.setItem(
                    "studentSection",
                    student.section
                );


                // ===============================
                // SAVE LOGIN TIME
                // ===============================

                localStorage.setItem(
                    "loginDate",
                    data.loginDate
                );


                localStorage.setItem(
                    "loginTime",
                    data.loginTime
                );


                alert(
                    "Welcome " +
                    student.name +
                    "!"
                );


                // ===============================
                // GO TO DASHBOARD
                // ===============================

                window.location.href =
                    "dashboard.html";

            } else {

                alert(
                    data.message ||
                    "Invalid Student ID or Password"
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "Server connection failed. Please start the backend."
            );

        }

    });

}



// ===============================
// LOGOUT
// ===============================

function logout() {

    // Remove student session data

    localStorage.removeItem(
        "studentId"
    );

    localStorage.removeItem(
        "studentName"
    );

    localStorage.removeItem(
        "studentBranch"
    );

    localStorage.removeItem(
        "studentYear"
    );

    localStorage.removeItem(
        "studentSection"
    );

    localStorage.removeItem(
        "loginDate"
    );

    localStorage.removeItem(
        "loginTime"
    );


    alert(
        "You have been logged out!"
    );


    window.location.href =
        "index.html";

}