//const { response } = require("express");

const loginRequest = () => {
    console.log("Sending login request");
    // send login request to backend
    let userName = document.getElementById("userName").value;
    let password = document.getElementById("password").value;
    let twoFA = document.getElementById("twoFactor").value;

    userName = sanitizeInput(userName);
    password = sanitizeInput(password);
    twoFA = sanitizeInput(twoFA);

    key = "Work?";
    password = CryptoJS.AES.encrypt(password, key).toString();

    fetch('/csrf-token', {
        credentials: 'include' // Include cookies in the request
      })
        .then(response => response.json())
        .then(data => {
          const csrfToken = data.csrfToken;
          return fetch("/login", {
            method: "POST",
            body: JSON.stringify({
              userName,
              password,
              twoFA,
            }),
            headers: {
              "X-CSRF-Token": csrfToken,
              "Content-type": "application/json; charset=UTF-8",
            },
          });
        })
        .then(response => {
          if (!response.ok) {
            return response.text().then(error => { throw new Error(error) });
          }
          return response.json(); // Parse response as text
        })
        .then(text => {
          // Handle successful response
          if (text === "Login successful") {
            console.log("Login successful");
            showSuccessAlert();
          } else {
            alert(text); // Display the response text as an error message
          }
        })
        .catch(error => {
          console.log("Error:", error);
        });
function showSuccessAlert() {
    // Show the alert
    var alertBox = document.getElementById("alert");
    alertBox.style.display = "block";

    // Hide the alert after 3 seconds
    setTimeout(function () {
        alertBox.style.display = "none";
        window.location.href = "/blog";
    }, 2000);
}}

// const loginRequest = () => {
//     console.log("Sending login request");
//     // send login request to backend
//     let userName = document.getElementById("userName").value;
//     let password = document.getElementById("password").value;
//     let twoFA = document.getElementById("twoFactor").value;

//     userName = sanitizeInput(userName);
//     password = sanitizeInput(password);
//     twoFA = sanitizeInput(twoFA);

//     key = "Work?";
//     password = CryptoJS.AES.encrypt(password, key).toString();

//     fetch('/csrf-token', {
//         credentials: 'include' // Include cookies in the request
//     })
//     .then(response => response.json())
//     .then(data => {
//         const csrfToken = data.csrfToken;

//         fetch("/login", {
//             method: "POST",
//             body: JSON.stringify({
//                 userName,
//                 password,
//                 twoFA,
//             }),
//             headers: {
//                 "X-CSRF-Token": csrfToken,
//                 "Content-type": "application/json; charset=UTF-8",
//             },
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error("Network response not ok");
//             }
//             return response.json();
//         })
//         .then(data => {
//             if (data.message === "Login successful") {
//                 console.log("Login successful");
//                 showSuccessAlert();
//             } else if (data.status === 429) {
//                 alert("Too many attempts, please try again later");
//             } else {
//                 alert(data.message);
//             }
//         });
//     });
// };

// function showSuccessAlert() {
//     // Show the alert
//     var alertBox = document.getElementById("alert");
//     alertBox.style.display = "block";

//     // Hide the alert after 3 seconds
//     setTimeout(function () {
//         alertBox.style.display = "none";
//         window.location.href = "/blog";
//     }, 2000);
// }


// const loginRequest = () => {
//     console.log("Sending login request");
//     // send login request to backend
//     let userName = document.getElementById("userName").value;
//     let password = document.getElementById("password").value;
//     let twoFA = document.getElementById("twoFactor").value;

//     userName = sanitizeInput(userName);
//     password = sanitizeInput(password);
//     twoFA = sanitizeInput(twoFA);

//     key = "Work?";
//     password = CryptoJS.AES.encrypt(password, key).toString();

//     fetch('/csrf-token', {
//         credentials: 'include' // Include cookies in the request
//     })
//     // .then(({ csrfToken, csrfCookie }) => {
//     //     console.log(csrfToken); // CSRF token from response headers
//     //     console.log(csrfCookie); // CSRF token from cookie

//     //     // Use either csrfToken or csrfCookie as needed
//     //     const tokenToSend = csrfToken || csrfCookie;
        
//         fetch("/login", {
//             method: "POST",
//             body: JSON.stringify({
//                 userName,
//                 password,
//                 twoFA,
//                 "X-CSRF-Token": csrfToken // Use the tokenToSend value
//             }),
//             headers: {
//                 "X-CSRF-Token": csrfToken,
//                 "Content-type": "application/json; charset=UTF-8",
//             },
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error("Network response not ok");
//             }
//             return response.json();
//         })
//         .then(data => {
//             if (data.message === "Login successful") {
//                 console.log("Login successful");
//                 showSuccessAlert();
//             } else if (data.status === 429) {
//                 alert("Too many attempts, please try again later");
//             } else {
//                 alert(data.message);
//             }
//         });
// };   
    
// function showSuccessAlert() {
//     // Show the alert
//     var alertBox = document.getElementById("alert");
//     alertBox.style.display = "block";

//     // Hide the alert after 3 seconds
//     setTimeout(function () {
//         alertBox.style.display = "none";
//         window.location.href = "/blog";
//     }, 2000);
// }
