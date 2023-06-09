const database = require("./db");
const steraliseInput = require("./inputSterilisation");
const blog = require("express").Router();
const bodyParser = require("body-parser");
const CryptoJS = require("crypto-js");
const rateLimit = require("express-rate-limit");

require("dotenv").config({ path: "./config.env" });

// uses express-rate-limitm to limit requests to 200 per 1min window
// if exceeded will destory user session and kick out
const dosLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    handler: (req, res) => {
        console.log("DOS attack detected");
        req.session.destroy((err) => {
            if (err) {
                console.log("error");
            } else {
                res.status(429).sendFile("bad.html", { root: "../frontend" });
            }
        });
    },
});

blog.get("/", dosLimiter, (req, res) => {
    res.sendFile("blog.html", { root: "../frontend" });
});

blog.get("/updatePost", dosLimiter, (req, res) => {
    res.sendFile("updatePost.html", { root: "../frontend" });
});

blog.get("/updatePost.js", dosLimiter, (req, res) => {
    res.sendFile("updatePost.js", { root: "../frontend" });
});

blog.get("/createPost", dosLimiter, (req, res) => {
    res.sendFile("createPost.html", { root: "../frontend" });
});

blog.get("/createPost.js", dosLimiter, (req, res) => {
    res.sendFile("createPost.js", { root: "../frontend" });
});

// sends an array of posts
blog.get("/posts", dosLimiter, async (res, req) => {
    // explicit convertion to int to prevent sql injection
    const user_id = Number(res.session.user_id);

    data = await database.query(`select users.user_name, users.user_id,
    posts.post_id, posts.user_id, posts.title, posts.body, posts.created_at, posts.updated_at 
    from user_data.posts 
    inner join user_data.users on posts.user_id = users.user_id
    order by created_at`);

    req.send(JSON.stringify((data = { posts: data.rows, id: user_id })));
});

blog.post("/deleteRequest", dosLimiter, async (req, res) => {
    // explicit convertion to int to prevent sql injection
    const user_id = Number(req.session.user_id);
    const post_id = Number(req.body.post_id);

    const { rows } = await database.query(
        `select user_id from user_data.posts where post_id = $1`,
        [post_id]
    );

    // check is user owns the post to be deleted
    if (rows[0].user_id != user_id) {
        res.status(404).send();
        return;
    }

    // deltes the post
    try {
        await database.query(`delete from user_data.posts where post_id = $1`, [
            post_id,
        ]);
        res.status(200).send();
        getPosts();
    } catch (error) {
        res.status(404).send();
    }
});

blog.post("/updateRequest", dosLimiter, async (req, res) => {
    const user_id = Number(req.session.user_id);
    const post_id = Number(req.body.post_id);

    // check the suer owens the post
    data = await database.query(
        `select user_id from user_data.posts where post_id = $1`,
        [post_id]
    );
    // deletes the post if they own it
    if (data.rows[0].user_id === user_id) {
        res.redirect("/blog/updatePost");
    } else {
        res.status(404).send();
    }
});

blog.post("/createPost", dosLimiter, async (req, res) => {
    // inserts a new post afer seralising the text
    try {
        database.query(
            `insert into user_data.posts (user_id,title,body,created_at)
        values ($1,$2,$3,current_date)`,
            [
                Number(req.session.user_id),
                steraliseInput(req.body.title),
                steraliseInput(req.body.body),
            ]
        );
        res.redirect("/blog");
    } catch (err) {
        console.error(err);
        res.status(404).send();
    }
});

blog.post("/updatePost", dosLimiter, async (req, res) => {
    const user_id = Number(req.session.user_id);
    const post_id = Number(req.body.post_id);

    data = await database.query(
        `select user_id from user_data.posts where post_id = $1`,
        [post_id]
    );

    // updates a post if the user owns it
    if (data.rows[0].user_id != user_id) {
        res.status(404).send();
    } else {
        try {
            await database.query(
                `update user_data.posts
            set title = $1,
            body = $2,
            updated_at = current_date
            where post_id = $3`,
                [
                    steraliseInput(req.body.title),
                    steraliseInput(req.body.body),
                    post_id,
                ]
            );

            res.redirect("/blog");
        } catch (err) {
            console.error(err);
            res.status(404).send();
        }
    }
});

blog.post("/search", dosLimiter, async (req, res) => {
    user_id = req.session.user_id;
    // steralise the user input
    searchText = steraliseInput(req.body.searchText);

    // usese the like operater to select posts like the users input
    data = await database.query(
        `
  SELECT users.user_name, users.user_id, posts.post_id, posts.user_id, posts.title, posts.body, posts.created_at, posts.updated_at
  FROM user_data.posts
  INNER JOIN user_data.users ON posts.user_id = users.user_id
  WHERE posts.title LIKE '%' || $1 || '%' OR posts.body LIKE '%' || $1 || '%'
  ORDER BY created_at
`,
        [searchText]
    );

    res.send(JSON.stringify((data = { posts: data.rows, id: user_id })));
});

module.exports = blog;
