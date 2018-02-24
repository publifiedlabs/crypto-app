const express = require('express');
const router = express.Router();

// Database Init
const mysql = require('mysql');
const config = require('../config/database');
const db = mysql.createConnection(config);

// Get Posts Page from posts table
router.get('/', authenticationMiddleware(), (req, res, next) => {
    let sql = `SELECT * FROM posts ORDER BY createdOn DESC`;
    let query = db.query(sql, (error, posts) => {
        db.query(`SELECT id, name FROM users`, (error, users) => {
            if(error) throw error;
            res.render('posts', {
                title: 'Posts',
                posts: posts,
                users: users
            });
        });
    });
});

// Get Edit Page
router.get('/update/:id', authenticationMiddleware(), (req, res, next) => {
    let sql = `SELECT * FROM posts WHERE id = ${req.params.id}`;
    let query = db.query(sql, (error, post) => {
        if(error) throw error;
        res.render('post-edit', {
            posts: post
        });
    });
});

// Create A Post
router.post('/', authenticationMiddleware(), (req, res, next) => {
    req.checkBody('body', 'Body field can not be empty.').notEmpty();
    let title = req.body.title;
    let body = req.body.body;
    let author = req.user.user_id;
    let sql = `INSERT INTO posts(title, body, author) VALUES(?, ?, ?)`;
    let query = db.query(sql, [title, body, author], (error) => {
        if(error) throw error;
        res.redirect('/posts');
    });
});

// Read A Post
router.get('/:id', authenticationMiddleware(), (req, res, next) => {
    let sql = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
    let query = db.query(sql, (error, result) => {
        if(error) throw error;
        db.query(`SELECT * FROM posts WHERE posts.id = ${req.params.id}`, (error, post) => {
            res.render('post', {
                posts: result,
                postID: post
            });
        });
    });
});

// Update A Post
router.post('/update/:id', authenticationMiddleware(), (req, res, next) => {
    let newTitle = req.body.title;
    let newBody = req.body.body;
    let sql = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
    let query = db.query(sql, (error, result) => {
        if(error) throw error;
        if(result[0].author != req.user.user_id) {
            res.send('You can not update this post');
        } else {
            db.query(`UPDATE posts SET title = '${newTitle}', body = '${newBody}' WHERE id = ${req.params.id}`, (error) => {
                if(error) throw error;
                res.redirect('/posts');
            });
        }
    });
});

// Delete A Post
router.get('/delete/:id', authenticationMiddleware(), (req, res, next) => {
    let sql = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
    let query = db.query(sql, (error, result) => {
        if(error) throw error;
        if(result[0].author != req.user.user_id) {
            res.send('You can not delete this post');
        } else {
            db.query(`DELETE FROM posts WHERE id = ${req.params.id}`, (error) => {
                if(error) throw error;
                res.redirect('/posts');
            });
        }
    });
});

function authenticationMiddleware() {
    return (req, res, next) => {
        if(req.isAuthenticated()) return next();
        res.redirect('/users/login');
    }
}

module.exports = router;
