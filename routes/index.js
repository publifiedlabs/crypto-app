const express = require('express');
const router = express.Router();

// Database Init
const DBConfig = require('../config/database');
let db = DBConfig.db;

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    let preparedQuery = {
      name: 'name',
      users: 'users',
      userId: req.user.user_id
    }
    let selectUser = `SELECT ?? FROM ?? WHERE id = ?`;
    let selectedUser;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(selectUser, [preparedQuery.name, preparedQuery.users, preparedQuery.userId])
        .then(rows => {
          selectedUser = rows;
        }).then(() => {
          res.render('index', { 
            title: 'Crypto Currency Calculator',
            users: selectedUser
          });
        }).catch(err => {
            if(err)
              console.error('You Have An Error:::', err);
        }));
  } else {
    res.render('index', { 
      title: 'Crypto Currency Calculator'
    });
  }
});

module.exports = router;
