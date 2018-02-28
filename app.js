const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('express-flash-messages');

const app = express();
// Sessions Setup
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
// Database Init
const DBConfig = require('./config/database');
let db = DBConfig.db;

// Login/Register Setup
const passport = require('passport');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// For MySql Express Session
let options = DBConfig.config;
let sessionStore = new MySQLStore(options);

// Express Session
app.use(session({
  secret: 'Jbn6LfM:@a.u%})',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
  // cookie: { secure: false }
}));
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
// Express Flash Messages -- CURRENTLY NOT IN USE, HAVING TROUBLE WITH SESSION STORAGE
app.use(flash());

// Global Objects
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user || null;
  next();
});

// Handle Routes
const index = require('./routes/index');
const users = require('./routes/users');
const posts = require('./routes/posts');

app.use('/', index);
app.use('/users', users);
app.use('/posts', posts);

//*** Uncomment to configure database. You can delete this section after DB configuration.
// const migrateDB = require('./migrations/db-mysql-migrate');
// app.use('/migrate', migrateDB);

// Passport Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
      db.query('SELECT id, password FROM users WHERE username = ?', [username], (err, results, fields) => {
        if(err) {done(err)};
        if(results.length === 0) {
            done(null, false);
        } else {
            const hash = results[0].password.toString();
            bcrypt.compare(password, hash, (err, response) => {
                if(response === true){
                    return done(null, {user_id: results[0].id});
                } else {
                    return done(null, false);
                }
            });
        }
    });
  }
));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
