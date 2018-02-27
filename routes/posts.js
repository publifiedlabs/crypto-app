const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

// Database Init
const DBConfig = require('../config/database');
let db = DBConfig.db;

// Get Posts Page from posts table
router.get('/', authenticationMiddleware(), (req, res, next) => {
    let selectPosts = `SELECT * FROM posts ORDER BY createdOn DESC`;
    let selectUsers = `SELECT id, name FROM users`;
    let postsResult, usersResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPosts)
        .then(rows => {
            postsResult = rows;
            return db.query(selectUsers);
        })
        .then(rows => {
            usersResult = rows;
        }).then(() => {
            res.render('posts', {
                posts: postsResult,
                users: usersResult
            });
        }).catch(err => {
            if(err)
                console.error('You Have An Error:::', err);
    }));
});

// Get Edit Page
router.get('/update/:id', authenticationMiddleware(), (req, res, next) => {
    let selectPost = `SELECT * FROM posts WHERE id = ${req.params.id}`;
    let postResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPost)
        .then(rows => {
            postResult = rows;
        }).then(() => {
            res.render('post-edit', {
                posts: postResult
            });
        }).catch(err => {
            if(err)
                console.error('You Have An Error:::', err);
    }));
});

// Create A Post
router.post('/', authenticationMiddleware(), (req, res, next) => {
    req.checkBody('title', 'Title field can not be empty.').notEmpty();
    req.checkBody('title', 'Title field must be atleast 2 characters').len(2, 255);
    req.checkBody('body', 'Body field can not be empty.').notEmpty();

    req.sanitize('title').trim();
    req.sanitize('title').escape();
    req.sanitize('body').trim();
    req.sanitize('body').escape();
    // check for errors
    const errors = req.validationErrors();
    if(errors) {
        let selectPosts = `SELECT * FROM posts ORDER BY createdOn DESC`;
        let selectUsers = `SELECT id, name FROM users`;
        let postsResult, usersResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPosts)
            .then(rows => {
                postsResult = rows;
                return db.query(selectUsers);
            })
            .then(rows => {
                usersResult = rows;
            }).then(() => {
                res.render('posts', {
                    posts: postsResult,
                    users: usersResult,
                    errors: errors,
                    title: req.body.title,
                    body: req.body.body
                });
            }).catch(err => {
                if(err)
                    console.error('You Have An Error:::', err);
        }));
      } else {
        let title = req.body.title;
        let body = req.body.body;
        let author = req.user.user_id;
        let insertPost = `INSERT INTO posts(title, body, author) VALUES(?, ?, ?)`;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(insertPost, [title, body, author])
            .then(() => {
                res.redirect('/posts');
            }).catch(err => {
                if(err)
                    console.error('You Have An Error:::', err);
        }));
      }
});

// Read A Post
router.get('/:id', authenticationMiddleware(), (req, res, next) => {
    let selectPostInfo = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
    let selectPostID = `SELECT * FROM posts WHERE posts.id = ${req.params.id}`;
    let postInfo, postID;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPostInfo)
        .then(rows => {
            postInfo = rows;
            return db.query(selectPostID);
        })
        .then(rows => {
            postID = rows;
        }).then(() => {
            res.render('post', {
                posts: postInfo,
                postID: postID
            });
        }).catch(err => {
            if(err)
                console.error('You Have An Error:::', err);
    }));
});

// Update A Post
router.post('/update/:id', authenticationMiddleware(), (req, res, next) => {
    req.checkBody('title', 'Title field can not be empty.').notEmpty();
    req.checkBody('title', 'Title field must be atleast 2 characters').len(2, 255);
    req.checkBody('body', 'Body field can not be empty.').notEmpty();

    req.sanitize('title').trim();
    req.sanitize('title').escape();
    req.sanitize('body').trim();
    req.sanitize('body').escape();
    // check for errors
    const errors = req.validationErrors();
    if(errors) {
        let selectPost = `SELECT * FROM posts WHERE id = ${req.params.id}`;
        let postResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPost)
            .then(rows => {
                postResult = rows;
            }).then(() => {
                res.render('post-edit', {
                    posts: postResult,
                    errors: errors
                });
            }).catch(err => {
                if(err)
                    console.error('You Have An Error:::', err);
        }));
    } else {
        let newTitle = req.body.title;
        let newBody = req.body.body;
        let selectPostInfo = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
        let updatePost = `UPDATE posts SET title = '${newTitle}', body = '${newBody}' WHERE id = ${req.params.id}`;
        let postResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPostInfo)
            .then(rows => {
                postResult = rows;
                if(postResult[0].author != req.user.user_id) {
                    res.send('You can not update this post');
                } else {
                    return db.query(updatePost);
                }
            }).then(() => {
                res.redirect('/posts');
            }).catch(err => {
                if(err)
                    console.error('You Have An Error:::', err);
        }));
    }
});

// Delete A Post
router.get('/delete/:id', authenticationMiddleware(), (req, res, next) => {
    let selectPostInfo = `SELECT * FROM posts INNER JOIN users ON posts.author = users.id WHERE posts.id = ${req.params.id}`;
    let deletePost = `DELETE FROM posts WHERE id = ${req.params.id}`;
    let postResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPostInfo)
        .then(rows => {
            postResult = rows;
            if(postResult[0].author != req.user.user_id) {
                res.send('You can not delete this post');
            } else {
                return db.query(deletePost);
            }
        }).then(() => {
            res.redirect('/posts');
        }).catch(err => {
            if(err)
                console.error('You Have An Error:::', err);
    }));
});

function authenticationMiddleware() {
    return (req, res, next) => {
        if(req.isAuthenticated()) return next();
        res.redirect('/users/login');
    }
}

module.exports = router;
