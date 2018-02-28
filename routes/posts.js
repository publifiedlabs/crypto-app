const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

// Database Init
const DBConfig = require('../config/database');
let db = DBConfig.db;

// Get Posts Page from posts table
router.get('/', authenticationMiddleware(), (req, res, next) => {
    let preparedQuery = {
        posts: 'posts',
        createdOn: 'createdOn',
        id: 'id',
        name: 'name',
        users: 'users'
    }
    let selectPosts = `SELECT * FROM ?? ORDER BY ?? DESC`;
    let selectUsers = `SELECT ??, ?? FROM ??`;
    let postsResult, usersResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPosts, [preparedQuery.posts, preparedQuery.createdOn])
        .then(rows => {
            postsResult = rows;
            return db.query(selectUsers, [preparedQuery.id, preparedQuery.name, preparedQuery.users]);
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
    let preparedQuery = {
        posts: 'posts',
        reqId: req.params.id
    }
    let selectPost = `SELECT * FROM ?? WHERE id = ?`;
    let postResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPost, [preparedQuery.posts, preparedQuery.reqId])
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
    let preparedQuery = {
        posts: 'posts',
        createdOn: 'createdOn',
        id: 'id',
        name: 'name',
        users: 'users',
        reqTitle: req.body.title,
        reqBody: req.body.body,
        reqAuthor: req.user.user_id
    }
    // check for errors
    const errors = req.validationErrors();
    if(errors) {
        let selectPosts = `SELECT * FROM ?? ORDER BY ?? DESC`;
        let selectUsers = `SELECT ??, ?? FROM ??`;
        let postsResult, usersResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPosts, [preparedQuery.posts, preparedQuery.createdOn])
            .then(rows => {
                postsResult = rows;
                return db.query(selectUsers, [preparedQuery.id, preparedQuery.name, preparedQuery.users]);
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
        let insertPost = `INSERT INTO ??(title, body, author) VALUES(?, ?, ?)`;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(insertPost, [preparedQuery.posts, preparedQuery.reqTitle, preparedQuery.reqBody, preparedQuery.reqAuthor])
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
    let preparedQuery = {
        title: 'title',
        body: 'body',
        author: 'author',
        createdOn: 'createdOn',
        name: 'name',
        email: 'email',
        username: 'username',
        posts: 'posts',
        users: 'users',
        reqId: req.params.id
    }
    let selectPostInfo = `SELECT ??, ??, ??, ??, ??, ??, ?? FROM ?? INNER JOIN ?? ON posts.author = users.id WHERE posts.id = ?`;
    let selectPostID = `SELECT * FROM ?? WHERE posts.id = ?`;
    let postInfo, postID;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPostInfo, [preparedQuery.title, preparedQuery.body, preparedQuery.author, preparedQuery.createdOn, preparedQuery.name, preparedQuery.email, preparedQuery.username, preparedQuery.posts, preparedQuery.users, preparedQuery.reqId])
        .then(rows => {
            postInfo = rows;
            return db.query(selectPostID, [preparedQuery.posts, preparedQuery.reqId]);
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
    let preparedQuery = {
        posts: 'posts',
        users: 'users',
        reqId: req.params.id,
        newTitle: req.body.title,
        newBody: req.body.body
    }
    // check for errors
    const errors = req.validationErrors();
    if(errors) {
        let selectPost = `SELECT * FROM ?? WHERE id = ?`;
        let postResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPost, [preparedQuery.posts, preparedQuery.reqId])
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
        let selectPostInfo = `SELECT * FROM ?? INNER JOIN ?? ON posts.author = users.id WHERE posts.id = ?`;
        let updatePost = `UPDATE ?? SET title = ?, body = ? WHERE id = ?`;
        let postResult;
        DBConfig.Database.execute(DBConfig.config,
            db => db.query(selectPostInfo, [preparedQuery.posts, preparedQuery.users, preparedQuery.reqId])
            .then(rows => {
                postResult = rows;
                if(postResult[0].author != req.user.user_id) {
                    res.send('You can not update this post');
                } else {
                    return db.query(updatePost, [preparedQuery.posts, preparedQuery.newTitle, preparedQuery.newBody, preparedQuery.reqId]);
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
    let preparedQuery = {
        posts: 'posts',
        users: 'users',
        reqId: req.params.id
    }
    let selectPostInfo = `SELECT * FROM ?? INNER JOIN ?? ON posts.author = users.id WHERE posts.id = ?`;
    let deletePost = `DELETE FROM ?? WHERE id = ?`;
    let postResult;
    DBConfig.Database.execute(DBConfig.config,
        db => db.query(selectPostInfo, [preparedQuery.posts, preparedQuery.users, preparedQuery.reqId])
        .then(rows => {
            postResult = rows;
            if(postResult[0].author != req.user.user_id) {
                res.send('You can not delete this post');
            } else {
                return db.query(deletePost, [preparedQuery.posts, preparedQuery.reqId]);
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
