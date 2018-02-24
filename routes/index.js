const express = require('express');
const router = express.Router();

// Database Init
const mysql = require('mysql');
const config = require('../config/database');
const db = mysql.createConnection(config);

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    let sql = `SELECT name FROM users WHERE id = ${req.user.user_id}`;
    let query = db.query(sql, (error, user) => {
      res.render('index', { 
        title: 'Crypto Currency Calculator',
        users: user
      });
    });
  } else {
    res.render('index', { 
      title: 'Crypto Currency Calculator'
    });
  }
});

module.exports = router;
