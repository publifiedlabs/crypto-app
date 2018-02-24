'use strict'

const express = require('express');
const router = express.Router();

// Database Init
const mysql = require('mysql');
const config = require('../config/database');
const db = mysql.createConnection(config);

// Migration Page
router.get('/', (req, res, next) => {
    res.render('db-migrate');
});

// Create And Configure Database
router.get('/configureDB', (req, res, next) => {
    let usersTable = `CREATE TABLE users
            (id int AUTO_INCREMENT,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    username VARCHAR(255),
                    password VARCHAR(255),
                    PRIMARY KEY(id));`;
    let postsTable = `CREATE TABLE posts
            (id int AUTO_INCREMENT,
                title VARCHAR(255),
                body TEXT,
                author VARCHAR(255),
                createdOn TIMESTAMP NOT NULL DEFAULT current_timestamp,
                PRIMARY KEY(id),
                FOREIGN KEY(author) REFERENCES users(id));`;
    let ledgersTable = `CREATE TABLE ledgers
            (id int AUTO_INCREMENT,
                amount FLOAT NOT NULL,
                author int,
                currency VARCHAR(100),
                createdOn TIMESTAMP NOT NULL DEFAULT current_timestamp,
                PRIMARY KEY(id));`;
    let alterUsersTable = `ALTER TABLE users ADD UNIQUE INDEX(email, username);`;
    let alterLedgersTable = `ALTER TABLE ledgers ADD UNIQUE INDEX(author, currency);`;
    let query = db.query(usersTable, (error) => {
        if(error) throw error;
        db.query(postsTable, (error) => {
            if(error) throw error;
            db.query(ledgersTable, (error) => {
                if(error) throw error;
                db.query(alterUsersTable, (error) => {
                    if(error) throw error;
                    db.query(alterLedgersTable, (error) => {
                        if(error) throw error;
                        res.render('db-migrate', {
                            successMessage: 'Your Database Has Been Configured!'
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
