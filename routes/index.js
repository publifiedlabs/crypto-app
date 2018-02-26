const express = require('express');
const router = express.Router();

// Database Init
const DBConfig = require('../config/database');
let db = DBConfig.db;

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    let selectUser = `SELECT name FROM users WHERE id = ${req.user.user_id}`;
    let selectedUser;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(selectUser)
        .then(rows => {
          selectedUser = rows;
        }).then(() => {
          res.render('index', { 
            title: 'Crypto Currency Calculator',
            users: selectedUser
          });
        }));
  } else {
    res.render('index', { 
      title: 'Crypto Currency Calculator'
    });
  }
});

module.exports = router;
