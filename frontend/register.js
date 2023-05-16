/*
 * Author: Harvey Thompson
 * Date: 20/03/2023
 * Description: This file contains the code for the home page of the website.
 *             It is the first page that the user will see when they visit the website.
 */

// function to return an array of the most common passwords from a text file
const getPasswords = async () => {
    const response = await fetch("/toppwd.text");
    const data = await response.text();
    const dataArray = data.split("\n"); // split data by newlines to create an array
    return dataArray;
};

const getRegistration = async () => {
    // get array of top passwords from function
    let pwdArray = await getPasswords();
    console.log(typeof pwdArray);
    pwdArray = pwdArray.map((pwd) => pwd.trim());

    // get the user details from the form
    let name = document.getElementById("Name").value;
    let userName = document.getElementById("userName").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    name = sanitizeInput(name);
    userName = sanitizeInput(userName);
    email = sanitizeInput(email);
    password = sanitizeInput(password);

    // check if password is common
    if (isPasswordCommon(password, pwdArray)) {
        alert("Password is too common");
        return;
    }
    if (!isPasswordStrong(password)) {
        alert("Password is not strong enough");
        return;
    }

    // salt the password before hashing
    // appened salt after pwd
    const salt = generateSalt(10);
    const saltedPassword = password + salt; // concatenate password and salt
    const hash = CryptoJS.SHA256(saltedPassword).toString();
    // send user details to database with use of fetch API
fetch("/csrf-token", {
        credentials: "include", // Include cookies in the request
    })
    .then((response) => response.json())
    .then((data) => {
        const csrfToken = data.csrfToken;
        return fetch("/register", {
            method: "POST",
            body: JSON.stringify({
            name,
            userName,
            email,
            hash,
            salt,
            }),
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-type": "application/json; charset=UTF-8",
            },
      })
    })
        .then(function (res) {
            if (!res.ok) {
                // Registration failed
                alert(
                    "Username or email in use. Please check if you allready have an account."
                );
                return Promise.reject(new Error("Registration failed"));
            } else {
                return res.json();
            }
        })
        .then(function (res) {
            code = res.twoFA;
            alert("2fa code = " + code.toString());
            console.log(typeof code);
            console.log("Registration successful");
            // Registration successful
            let qr = qrcode(4, "L");
            qr.addData(code.toUpperCase());
            qr.make();

            // Create an image element with the QR code data
            let imgElement = document.createElement("img");
            imgElement.src = qr.createDataURL();

            // Set the desired size for the QR code
            let size = 300; // Adjust the size as per your requirement
            imgElement.style.width = size + "px";
            imgElement.style.height = size + "px";

            // Get the container elements
            let qrContainer = document.getElementById("qr");

            // Append the image to the QR code container
            qrContainer.appendChild(imgElement);

            showSuccessAlert();
        })
        .catch((error) => {
            console.log("Error:", error);
            // Handle the error here
            //do nothing
        });
    };
// function to check if password is in the most common password
const isPasswordCommon = (password, commonPasswords) => {
    return commonPasswords.includes(password);
};

// function to
const isPasswordStrong = (password) => {
    // Check for length
    if (password.length < 10) {
        return false;
    }

    // Check for at least 1 number
    if (!/\d/.test(password)) {
        return false;
    }

    // Check for repeated characters
    if (/(\w)\1\1/.test(password)) {
        return false;
    }

    // Check for number sequence
    if (/\d{3}/.test(password)) {
        return false;
    }

    // If all checks pass, return true
    return true;
};

function showSuccessAlert() {
    // Show the alert
    let alertBox = document.getElementById("alert");
    alertBox.style.display = "block";

    // Hide the alert after 2 mins
    setTimeout(function () {
        alertBox.style.display = "none";
        window.location.href = "/";
    }, 120000);
}

const generateSalt = (length) => {
    let chars =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let salt = "";
    for (let i = 0; i < length; i++) {
        salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
};

function redirectToLogin() {
    window.location.href = "/";
}

module.exports.getPasswords = getPasswords;
module.exports.isPasswordCommon = isPasswordCommon;
module.exports.isPasswordStrong = isPasswordStrong;
