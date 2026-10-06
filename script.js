const form = document.querySelector("form");


// ===============================
// LOGIN
// ===============================

if (form) {

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        let studentId = document
            .querySelector('input[type="text"]')
            .value
            .trim();

        let password = document
            .querySelector('input[type="password"]')
            .value
            .trim();


        // Empty fields check
        if (studentId === "" || password === "") {

            alert("Please enter Student ID and Password");

            return;
        }


        try {

            // Backend ki login request
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


            const data = await response.json();


            if (data.success) {

                // Student ID save cheyyadam
                localStorage.setItem(
                    "studentId",
                    studentId
                );


                alert(data.message);


                // Dashboard ki velladam
                window.location.href = "dashboard.html";

            } else {

                alert(data.message);

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

    alert("You have been logged out!");

    window.location.href = "index.html";

}