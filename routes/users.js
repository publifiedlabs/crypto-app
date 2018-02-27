const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

// Database Init
const DBConfig = require('../config/database');
let db = DBConfig.db;

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

  req.sanitize('name').trim();
  req.sanitize('name').escape();
  req.sanitize('email').trim();
  req.sanitize('email').escape();
  req.sanitize('username').trim();
  req.sanitize('username').escape();
  req.sanitize('password').trim();
  req.sanitize('password').escape();

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
      let registerUser = `INSERT INTO users(name, email, username, password) VALUES(?, ?, ?, ?)`;
      let selectLastUser = `SELECT LAST_INSERT_ID() as user_id`;
      let lastUser;
      DBConfig.Database.execute(DBConfig.config,
        db => db.query(registerUser, [name, email, username, hash])
        .then(() => {
          return db.query(selectLastUser);
        })
        .then(rows => {
          lastUser = rows;
        }).then(() => {
            const user_id = lastUser[0];
            req.login(user_id, () => {
              res.redirect('/');
            });
        }).catch(err => {
            if(err)
              console.error('You Have An Error:::', err);
      }));
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

  req.sanitize('username').trim();
  req.sanitize('username').escape();
  req.sanitize('password').trim();
  req.sanitize('password').escape();  

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
  let userInfo = `SELECT id, name, email, username FROM users WHERE users.id = ${req.user.user_id}`
  let user;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(userInfo)
    .then(rows => {
      user = rows;
    }).then(() => {
      res.render('profile', {
        title: 'Profile',
        users: user
      });
    }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
  }));
});

// Update Profile
router.post('/update/:id', (req, res, next) => {
  req.checkBody('name', 'Name field can not be empty.').notEmpty();
  req.checkBody('name', 'Name field must be atleast 2 characters').len(2, 255);
  req.checkBody('email', 'The email you entered is not valid.').isEmail();
  req.checkBody('email', 'Email address must be 4-100 characters long.').len(4, 100);
  req.checkBody('username', 'Username field can not be empty.').notEmpty();
  req.checkBody('username', 'Username must be 4-15 characters long.').len(4, 15);

  req.sanitize('name').trim();
  req.sanitize('name').escape();
  req.sanitize('email').trim();
  req.sanitize('email').escape();
  req.sanitize('username').trim();
  req.sanitize('username').escape();
  // check for errors
  const errors = req.validationErrors();
  if(errors) {
    let userInfo = `SELECT id, name, email, username FROM users WHERE users.id = ${req.user.user_id}`
    let user;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(userInfo)
      .then(rows => {
        user = rows;
      }).then(() => {
        res.render('profile', {
          title: 'Profile',
          users: user,
          errors: errors
        });
      }).catch(err => {
        if(err)
          console.error('You Have An Error:::', err);
    }));
  } else {
    let newName = req.body.name;
    let newEmail = req.body.email;
    let newUsername = req.body.username;
    let updateUser = `UPDATE users SET name = '${newName}', email = '${newEmail}', username = '${newUsername}' WHERE id = ${req.params.id}`;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(updateUser)
      .then(() => {
        res.redirect('/users/profile');
    }).catch(err => {
        if(err)
          console.error('You Have An Error:::', err);
    }));
  }
});

/***************************/
/***** CURRENCIES PAGE *****/
/***************************/

// Get Currencies
router.get('/currencies', authenticationMiddleware(), (req, res, next) => {
  let getCurrencies = `SELECT * FROM ledgers WHERE ledgers.author = ${req.user.user_id} ORDER BY createdOn DESC`;
  let cryptos;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(getCurrencies)
    .then(rows => {
      cryptos = rows;
    }).then(() => {
      res.render('currencies', {
        title: 'Currencies',
        cryptos: cryptos
      });
  }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
  }));
});

// Create Currency
router.post('/createCurrency', (req, res, next) => {
  req.sanitize('currencyType').trim();
  req.sanitize('currencyType').escape();
  let amount = 0;
  let author = req.user.user_id;
  let currency = req.body.currencyType;
  let createCurrency = `INSERT INTO ledgers(amount, author, currency) VALUES (?, ?, ?)`;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(createCurrency, [amount, author, currency])
    .then(() => {
      res.redirect('/users/currencies');
    }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
        res.redirect('/users/currencies');
  }));
});

// Update Currency
router.post('/currencies/:id', (req, res, next) => {
  req.sanitize('amount').trim();
  req.sanitize('amount').escape();
  let amount = req.body.amount;
  let selectCurrency = `SELECT * FROM ledgers WHERE ledgers.id = ${req.params.id}`;
  let updateCurrency = `UPDATE ledgers SET amount = '${amount}' WHERE id = ${req.params.id}`;
  let currencyResult;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(selectCurrency)
    .then(rows => {
      currencyResult = rows;
      if(currencyResult[0].author != req.user.user_id) {
        res.send('You can not update this ledger');
      } else {
        return db.query(updateCurrency);
      }
    }).then(() => {
      res.redirect('/users/currencies');
    }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
        res.redirect('/users/currencies')
  }));
});

// Delete Currency
router.get('/delete/:id', (req, res, next) => {
  let selectCurrency = `SELECT * FROM ledgers WHERE ledgers.id = ${req.params.id}`;
  let deleteCurrency = `DELETE FROM ledgers WHERE id = ${req.params.id}`;
  let currencyResult;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(selectCurrency)
    .then(rows => {
      currencyResult = rows;
      if(currencyResult[0].author != req.user.user_id) {
        res.send('You can not delete this ledger');
      } else {
        return db.query(deleteCurrency);
      }
    }).then(() => {
        res.redirect('/users/currencies');
    }).catch(err => {
        if(err)
          console.error('You Have An Error:::', err);
  }));
});

function authenticationMiddleware() {
  return (req, res, next) => {
      if(req.isAuthenticated()) return next();
      res.redirect('login');
  }
}

module.exports = router;
