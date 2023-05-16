const express = require("express");
const session = require("express-session");
const CryptoJS = require("crypto-js");
const https = require("https");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
require("dotenv").config({ path: "./config.env" });

const users = require("./users");
const login = require("./login");
const blog = require("./blog");
const { config } = require("dotenv");

// set up server
const app = express();
const csrfProtection = csrf({ cookie: true });
// middleware
app.use((req, res, next) => {
    if (req.protocol === "http") {
        res.redirect(`https://${req.hostname}${req.url}`);
    } else {
        next();
    }
});

app.use(cookieParser());
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true, // Ensures cookies are only sent over HTTPS
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            sameSite: "strict", // Restricts the cookie to be sent only with same-site requests
            maxAge: 1000 * 60 * 60 * 24, // expiration time 1 day
        },
    })
);

app.use(csrfProtection);
 app.use((req, res, next) =>{
     res.setHeader('X-CSRF-Token', req.csrfToken());
     next();
 })

// express routers
app.get("/hashing", (req, res) => {
    res.sendFile("bower_components/crypto-js/crypto-js.js", { root: "../" });
});

app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
app.use('/', login);

//app.use('/login', csrfProtection, login)

app.use("/blog", checkSessionValidity, checkAuthenticated, blog);

app.get("/main.css", function (req, res) {
    res.sendFile("main.css", { root: "../frontend" });
});

app.get("/inputSterilisation.js", function (req, res) {
    res.sendFile("inputSterilisation.js", { root: "../frontend" });
});

app.get("/register.js", function (req, res) {
    res.sendFile("register.js", { root: "../frontend" });
});
app.get("/login.js", function (req, res) {
    res.sendFile("login.js", { root: "../frontend" });
});
app.get("/qr", function (req, res) {
    res.sendFile("qrcode.js", { root: "../frontend" });
});
app.get('/csrf-token', (req, res) => {
    res.send(req.csrfToken());
});

app.get("/blog.js", (req, res) => {
    res.sendFile("blog.js", { root: "../frontend" });
});

app.get("/toppwd.text", function (req, res) {
    res.sendFile("100pwd.txt", { root: "../" });
});

app.get("/bad", function (req, res) {
    res.sendFile("/bad.html", { root: "../frontend" });
});

app.get("/logout", checkAuthenticated, function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            res.status(409).send();
        } else {
            res.status(200).send();
        }

    });
});
app.use("/register", users);

function checkAuthenticated(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        console.log("not auth");
        res.redirect("/");
    }
}

function checkSessionValidity(req, res, next) {
    let timeSinceLastRequest = performance.now() - req.session.lastRequest
    user_ip = CryptoJS.SHA256(req.socket.remoteAddress).toString();


    if (req.session.user_ip != user_ip) {
        console.log("ip changed");
        req.session.destroy((err) => {
            if (err) {
                console.log("error");
            } else {
                res.redirect("/");
            }
        });
        return
    }

    if(timeSinceLastRequest>(1000*60*30)){// 5 mins
        console.log("session innactive");
        req.session.destroy((err) => {
            if (err) {
                console.log("error");
            } else {
                res.redirect("/");
            }
        });
        return
    }
    req.session.lastRequest = performance.now()
    next();
}  


// error handling for csrf
app.use((error, req, res, next) => {
    if (error.code === 'EBADCSRFTOKEN') {
        // errors here
        res.status(403);
        res.sendFile(path.join(__dirname, '../frontend/bad.html'));
        console.log(__dirname)
    } else {
        // !pass it to the next error handler
        next(error);
    }
});
app.use((error, req, res, next) => {
    console.error(error);

    // (Internal Server Error)
    res.status(500);
    res.send('An error occurred. Please try again later.');
});
const httpsOptions = {
    key: fs.readFileSync("./certificates/key.pem"),
    cert: fs.readFileSync("./certificates/cert.pem"),
};

const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(5000, () => {
    console.log("HTTPS server listening on port 5000");
});
