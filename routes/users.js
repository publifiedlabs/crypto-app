const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

// Database Init
const mysql = require('mysql');
const config = require('../config/database');
const db = mysql.createConnection(config);

// Login/Register Setup
const passport = require('passport');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

/****************************/
/***** LOGIN & REGISTER *****/
/****************************/

// Register Page
router.get('/register', function(req, res, next) {
    res.render('register');
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', (req, res, next) => {
  req.checkBody('name', 'Name field can not be empty.').notEmpty();
  req.checkBody('name', 'Name field must be atleast 2 characters').len(2, 255);
  req.checkBody('email', 'The email you entered is not valid.').isEmail();
  req.checkBody('email', 'Email address must be 4-100 characters long.').len(4, 100);
  req.checkBody('username', 'Username field can not be empty.').notEmpty();
  req.checkBody('username', 'Username must be 4-15 characters long.').len(4, 15);
  req.checkBody('password', 'Password must be 8-100 characters long.').len(8, 100);
  req.checkBody('password', 'Password must include one lowercase character, one uppercase character, a number and a special character').matches('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,100}$');
  req.checkBody('passwordMatch', 'Password do not match, please try again').equals(req.body.password);
  // check for errors
  const errors = req.validationErrors();
  if(errors) {
    res.render('register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      username: req.body.username
    });
  } else {
    let name = req.body.name;
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;

    bcrypt.hash(password, saltRounds, function(err, hash) {
      let sql = `INSERT INTO users(name, email, username, password) VALUES(?, ?, ?, ?)`;
      let query = db.query(sql, [name, email, username, hash], (error, result, fields) => {
        if(error) throw error;
        // CHANGE THIS WITH PROMISES TO CLEAN UP THE CODE
          db.query('SELECT LAST_INSERT_ID() as user_id', (error, results, fields) => {
            if(error) throw error;
                const user_id = results[0];
                req.login(user_id, (err) => {
                res.redirect('/');
            });
          });
      });
    });
  }
});

// Login Setup
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  req.checkBody('username', 'Username field can not be empty.').notEmpty();
  req.checkBody('password', 'Password field can not be empty.').notEmpty();
    // check for errors
    const errors = req.validationErrors();
    if(errors) {
      res.render('login', {
        errors: errors
      });
    } else {
      router.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login'
      }));
      next();
    }
});

/******************/
/***** LOGOUT *****/
/******************/

// Logout Page
router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/users/login');
});

passport.serializeUser((user_id, done) => {
  done(null, user_id);
});

passport.deserializeUser((user_id, done) => {
    done(null, user_id);
});

/************************/
/***** PROFILE PAGE *****/
/************************/

// Get Profile
router.get('/profile', authenticationMiddleware(), (req, res, next) => {
  let sql = `SELECT id, name, email, username FROM users WHERE users.id = ${req.user.user_id}`
  let query = db.query(sql, (error, user) => {
    res.render('profile', {
      title: 'Profile',
      users: user
  });
  });
});

// Update Profile
router.post('/update/:id', (req, res, next) => {
  let newName = req.body.name;
  let newEmail = req.body.email;
  let newUsername = req.body.username;
  let sql = `UPDATE users SET name = '${newName}', email = '${newEmail}', username = '${newUsername}' WHERE id = ${req.params.id}`;
  let query = db.query(sql, (error) => {
    if(error) throw error;
    res.redirect('/users/profile');
  });
});

/***************************/
/***** CURRENCIES PAGE *****/
/***************************/

// Get Currencies
router.get('/currencies', authenticationMiddleware(), (req, res, next) => {
  let sql = `SELECT * FROM ledgers WHERE ledgers.author = ${req.user.user_id} ORDER BY createdOn DESC`;
  let query = db.query(sql, (error, cryptos) => {
    res.render('currencies', {
      cryptos: cryptos,
      title: 'Currencies'
    });
  });
});

// Create Currency
router.post('/createCurrency', (req, res, next) => {
  let amount = 0;
  let author = req.user.user_id;
  let currency = req.body.currencyType;
  let sql = `INSERT INTO ledgers(amount, author, currency) VALUES (?, ?, ?)`;
    let query = db.query(sql, [amount, author, currency], (error) => {
      if(error) {
        res.redirect('/users/currencies');
      } else {
        res.redirect('/users/currencies');
      }
  });
});

// Update Currency
router.post('/currencies/:id', (req, res, next) => {
  let amount = req.body.amount;
  let sql = `SELECT * FROM ledgers WHERE ledgers.id = ${req.params.id}`;
  let query = db.query(sql, (error, result) => {
    if(error) throw error;
    if(result[0].author != req.user.user_id) {
      res.send('You can not delete this ledger');
    } else {
      db.query(`UPDATE ledgers SET amount = '${amount}' WHERE id = ${req.params.id}`, (error) => {
        if(error) throw error;
        res.redirect('/users/currencies');
      });      
    }
  });
});

// Delete Currency
router.get('/delete/:id', (req, res, next) => {
  let sql = `SELECT * FROM ledgers WHERE ledgers.id = ${req.params.id}`;
  let query = db.query(sql, (error, result) => {
    if(error) throw error;
    if(result[0].author != req.user.user_id) {
      res.send('You can not delete this ledger');
    } else {
      db.query(`DELETE FROM ledgers WHERE id = ${req.params.id}`, (error) => {
        if(error) throw error;
        res.redirect('/users/currencies');
      });      
    }
  });
});

function authenticationMiddleware() {
  return (req, res, next) => {
      if(req.isAuthenticated()) return next();
      res.redirect('login');
  }
}

module.exports = router;
