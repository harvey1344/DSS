/*
 * Author: Harvey Thompson
 * Date: 27/03/2023
 * Description: Backend code for the user registration page.
 */

const database = require("./db");
const user = require("express").Router();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const twofactor = require("node-2fa");
const steraliseInput = require("./inputSterilisation");
const CryptoJS = require("crypto-js");
require("dotenv").config({ path: "./config.env" });

user.get("/", (req, res) => {
    res.sendFile("register.html", { root: "./frontend" });
});

user.post("/", jsonParser, async (req, res) => {
    let name = steraliseInput(req.body.name);
    let userName = steraliseInput(req.body.userName);
    let email = steraliseInput(req.body.email);
    let password = steraliseInput(req.body.hash);
    let salt = req.body.salt;
    let twoFA = twofactor.generateSecret({
        name: "blog",
        account: email,
    }).secret; 


    // Check if the email already exists in the database
    const { rows } = await database.query(
        `SELECT * FROM user_data.users WHERE user_name = $1`,
        [userName]
    );

    data = await database.query(`select email_address from user_data.users`)

    emails = data.rows

    emails = emails.map((email) => {
        const decryptedEmail = CryptoJS.AES.decrypt(email.email_address, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        email.email_address = decryptedEmail; // Update the email_address property with the decrypted value
        return email; // Return the updated email object
    });


    if (rows.length > 0) {
        res.status(409).send();
        return
    }else if(emails.includes(email)){
        res.status(409).send();
        return
    }


    // Email address and username are available, insert new record
    await database.query(
        `INSERT INTO user_data.users (name,user_name, email_address, password, salt, twoFA) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            CryptoJS.AES.encrypt(name, process.env.ENCRYPTION_KEY).toString(),
            userName,            
            CryptoJS.AES.encrypt(email, process.env.ENCRYPTION_KEY).toString(),
            password,
            CryptoJS.AES.encrypt(salt, process.env.ENCRYPTION_KEY).toString(),  
            CryptoJS.AES.encrypt(twoFA, process.env.ENCRYPTION_KEY).toString(),            
        ]
    );
    console.log(email, password, "user registered");
    res.status(200).send(JSON.stringify({ twoFA: twoFA }));
    console.log("Registration successful");
});

module.exports = user;
