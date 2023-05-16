/*
 * Author: Harvey Thompson Jack BAiley
 * Date: 27/03/2023
 * Description: Backend code for the login page. User has 5 attempts to login
 *              before being locked out for 10 minutes. On login, the users email address
 *              is looked up before combining the input password with salt and hashing.
 *              Then the hash is compared to the hash stored in the database.
 */

const database = require("./db");
const login = require("express").Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const rateLimit = require("express-rate-limit");
const CryptoJS = require("crypto-js");
const twofactor = require("node-2fa");
const steraliseInput = require("./inputSterilisation");
require('dotenv').config({ path: './config.env' });


// recording timings for types of authentication
let ammountOfReadingsStored = 300;

let avgPasswordComparison = 1;
let PasswordComparisonData = [];

function pushToPasswordComparisonData(element) {
    if (PasswordComparisonData.length === ammountOfReadingsStored) {
        PasswordComparisonData.shift();
    }
    PasswordComparisonData.push(element);

    let total = 0;
    PasswordComparisonData.forEach((number) => {
        total = total + number;
    });

    avgPasswordComparison = total / pushToPasswordComparisonData.length;
}

let avgTwoFa = 1;
let TwoFaData = [];

function pushToTwoFaData(element) {
    if (TwoFaData.length === TwoFaData) {
        TwoFaData.shift();
    }
    TwoFaData.push(element);

    let total = 0;
    TwoFaData.forEach((number) => {
        total = total + number;
    });

    avgTwoFa = total / TwoFaData.length;
}




// limit the number of login attempts from the same IP address
// uses the express-rate-limit package
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
});

// send the login page to the client
login.get("/", (req, res) => {
    // crsf token added to response
    //res.locals.csrfToken = req.csrfToken();
    res.sendFile("login.html", { root: "../frontend" });
});

login.post("/login", loginLimiter, jsonParser, async (req, res) => {
    console.log("Login request received");

    let userName = steraliseInput(req.body.userName);
    let password = steraliseInput(req.body.password);
    let twoFA = steraliseInput(req.body.twoFA);
    //let csrfToken = steraliseInput(req.body["X-CSRF-Token"]);

    console.log(userName, password, "username and password");
    //decrypt the password before hashing
    password = CryptoJS.AES.decrypt(password, "Work?").toString(
        CryptoJS.enc.Utf8
    );
    console.log(password, "decrypted password");

    // return the row if the user exits in the database
    const { rows } = await database.query(
        "SELECT * FROM user_data.users WHERE user_name = $1",
        [userName]
    );

    if (!(rows.length > 0)) {
        console.log("no user name found")
        // handle case when no user was found
        const attemptsLeft = res.getHeader("X-RateLimit-Remaining");

        setTimeout(() => {
            res.status(404).send({
                message: `Details did not match, try again. You have ${attemptsLeft} attempts left.`,
            });
        }, avgTwoFa + avgPasswordComparison);

        return;
    }

    const user = rows[0];
    daSalt = CryptoJS.AES.decrypt(user.salt,process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    daPwd = user.password;
    daPwdSalted = password + daSalt;
    daHashed = CryptoJS.SHA256(daPwdSalted).toString();
    token = CryptoJS.AES.decrypt(user.twofa,process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

    let timeOne = performance.now();

    if (!(daHashed === daPwd)) {
        // handle case when password does not match
        console.log("password no match")
        const attemptsLeft = res.getHeader("X-RateLimit-Remaining");

        setTimeout(() => {
            res.status(404).send({
                message: `Details did not match, try again. You have ${attemptsLeft} attempts left.`,
            });
        }, avgTwoFa);

        return;
    }

    let timeTwo = performance.now();

    if (!twofactor.verifyToken(token, twoFA)) {
        console.log("tokens didnt match");
        // handle case when 2FA does not match
        const attemptsLeft = res.getHeader("X-RateLimit-Remaining");
        res.status(404).send({
            message: `Details did not match, try again. You have ${attemptsLeft} attempts left.`,
        });
        return;
    }

    // attaches the user id to the session
    req.session.user_ip = CryptoJS.SHA256(req.socket.remoteAddress).toString();
    req.session.user_id = user.user_id;
    req.session.lastRequest = performance.now()
    req.session.save();
    res.status(200).send("Login successful");

    let timeThree = performance.now();
    pushToPasswordComparisonData(timeTwo - timeOne);
    pushToTwoFaData(timeThree - timeTwo);
});

module.exports = login;
