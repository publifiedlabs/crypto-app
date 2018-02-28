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

// CSURF Setup
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: true })

/****************************/
/***** LOGIN & REGISTER *****/
/****************************/

// Register Page
router.get('/register', csrfProtection, function(req, res, next) {
    res.render('register', {
      csrfToken: req.csrfToken()
    });
});

router.post('/register', csrfProtection, (req, res, next) => {
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
  let preparedQuery = {
    users: 'users',
    reqName: req.body.name,
    reqEmail: req.body.email,
    reqUsername: req.body.username
  }
  let password = req.body.password;
  // check for errors
  const errors = req.validationErrors();
  if(errors) {
    res.render('register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      csrfToken: req.csrfToken()
    });
  } else {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      let registerUser = `INSERT INTO ??(name, email, username, password) VALUES(?, ?, ?, ?)`;
      let selectLastUser = `SELECT LAST_INSERT_ID() as user_id`;
      let lastUser;
      DBConfig.Database.execute(DBConfig.config,
        db => db.query(registerUser, [preparedQuery.users, preparedQuery.reqName, preparedQuery.reqEmail, preparedQuery.reqUsername, hash])
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
router.get('/login', csrfProtection, (req, res) => {
  res.render('login', {
    csrfToken: req.csrfToken()
  });
});

router.post('/login', csrfProtection, (req, res, next) => {
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
        errors: errors,
        csrfToken: req.csrfToken()
      });
    } else {
      router.post('/login', csrfProtection, passport.authenticate('local', {
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
router.get('/logout', csrfProtection, (req, res) => {
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
router.get('/profile', authenticationMiddleware(), csrfProtection, (req, res, next) => {
  let preparedQuery = {
    id: 'id',
    name: 'name',
    email: 'email',
    username: 'username',
    users: 'users',
    reqUserId: req.user.user_id
  }
  let userInfo = `SELECT ??, ??, ??, ?? FROM ?? WHERE users.id = ?`
  let user;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(userInfo, [preparedQuery.id, preparedQuery.name, preparedQuery.email, preparedQuery.username, preparedQuery.users, preparedQuery.reqUserId])
    .then(rows => {
      user = rows;
    }).then(() => {
      res.render('profile', {
        title: 'Profile',
        users: user,
        csrfToken: req.csrfToken()
      });
    }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
  }));
});

// Update Profile
router.post('/update/:id', csrfProtection, (req, res, next) => {
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
  let preparedQuery = {
    id: 'id',
    name: 'name',
    email: 'email',
    username: 'username',
    users: 'users',
    reqUserId: req.user.user_id,
    newName: req.body.name,
    newEmail: req.body.email,
    newUsername: req.body.username,
    reqId: req.params.id
  }
  // check for errors
  const errors = req.validationErrors();
  if(errors) {
    let userInfo = `SELECT ??, ??, ??, ?? FROM ?? WHERE users.id = ?`
    let user;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(userInfo, [preparedQuery.id, preparedQuery.name, preparedQuery.email, preparedQuery.username, preparedQuery.users, preparedQuery.reqUserId])
      .then(rows => {
        user = rows;
      }).then(() => {
        res.render('profile', {
          title: 'Profile',
          users: user,
          errors: errors,
          csrfToken: req.csrfToken()
        });
      }).catch(err => {
        if(err)
          console.error('You Have An Error:::', err);
    }));
  } else {
    let updateUser = `UPDATE ?? SET name = ?, email = ?, username = ? WHERE id = ?`;
    DBConfig.Database.execute(DBConfig.config,
      db => db.query(updateUser, [preparedQuery.users, preparedQuery.newName, preparedQuery.newEmail, preparedQuery.newUsername, preparedQuery.reqId])
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
router.get('/currencies', authenticationMiddleware(), csrfProtection, (req, res, next) => {
  let preparedQuery = {
    ledgers: 'ledgers',
    createdOn: 'createdOn',
    reqUserId: req.user.user_id
  }
  let getCurrencies = `SELECT * FROM ?? WHERE ledgers.author = ? ORDER BY ?? DESC`;
  let cryptos;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(getCurrencies, [preparedQuery.ledgers, preparedQuery.reqUserId, preparedQuery.createdOn])
    .then(rows => {
      cryptos = rows;
    }).then(() => {
      res.render('currencies', {
        title: 'Currencies',
        cryptos: cryptos,
        csrfToken: req.csrfToken()
      });
  }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
  }));
});

// Create Currency
router.post('/createCurrency', csrfProtection, (req, res, next) => {
  req.sanitize('currencyType').trim();
  req.sanitize('currencyType').escape();
  let preparedQuery = {
    ledgers: 'ledgers',
    amount: 0,
    reqAuthor: req.user.user_id,
    reqCurrencyType: req.body.currencyType
  }
  let createCurrency = `INSERT INTO ??(amount, author, currency) VALUES (?, ?, ?)`;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(createCurrency, [preparedQuery.ledgers, preparedQuery.amount, preparedQuery.reqAuthor, preparedQuery.reqCurrencyType])
    .then(() => {
      res.redirect('/users/currencies');
    }).catch(err => {
      if(err)
        console.error('You Have An Error:::', err);
        res.redirect('/users/currencies');
  }));
});

// Update Currency
router.post('/currencies/:id', csrfProtection, (req, res, next) => {
  req.sanitize('amount').trim();
  req.sanitize('amount').escape();
  let preparedQuery = {
    ledgers: 'ledgers',
    amount: 'amount',
    reqAmount: req.body.amount,
    reqId: req.params.id
  }
  let selectCurrency = `SELECT * FROM ?? WHERE ledgers.id = ?`;
  let updateCurrency = `UPDATE ?? SET ?? = ? WHERE id = ?`;
  let currencyResult;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(selectCurrency, [preparedQuery.ledgers, preparedQuery.reqId])
    .then(rows => {
      currencyResult = rows;
      if(currencyResult[0].author != req.user.user_id) {
        res.send('You can not update this ledger');
      } else {
        return db.query(updateCurrency, [preparedQuery.ledgers, preparedQuery.amount, preparedQuery.reqAmount, preparedQuery.reqId]);
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
router.get('/delete/:id', csrfProtection, (req, res, next) => {
  let preparedQuery = {
    ledgers: 'ledgers',
    reqId: req.params.id
  }
  let selectCurrency = `SELECT * FROM ?? WHERE ledgers.id = ?`;
  let deleteCurrency = `DELETE FROM ?? WHERE id = ?`;
  let currencyResult;
  DBConfig.Database.execute(DBConfig.config,
    db => db.query(selectCurrency, [preparedQuery.ledgers, preparedQuery.reqId])
    .then(rows => {
      currencyResult = rows;
      if(currencyResult[0].author != req.user.user_id) {
        res.send('You can not delete this ledger');
      } else {
        return db.query(deleteCurrency, [preparedQuery.ledgers, preparedQuery.reqId]);
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
