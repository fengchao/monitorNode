var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('busboy');

var passport = require('passport');
var User = require('./models/User');
passport.use(User.localStrategy);
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

var index = require('./routes/index');
var monitorLog = require('./routes/monitorLog');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/db', function (error) {
	if (error) {
		console.log(error);
	}
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Default session handling. Won't explain it as there are a lot of resources out there
app.use(session({
    secret: "mylittlesecret",
}));

// The important part. Must go AFTER the express session is initialized
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var ensureAuthenticated = function (req, res, next) {
	  if (req.path === '/login' || req.isAuthenticated()) {
	    return next();
	  }
	  res.redirect('/login')
};

app.get('/*', ensureAuthenticated, function(req, res, next) {
	  next();
});

app.post('/*', ensureAuthenticated, function(req, res, next) {
	  next();
});

app.use('/', index);
app.use('/monitorlog', monitorLog);

//Set up your express routes
var auth = require('./routes/authController.js');

app.get('/login', auth.loginGet);
app.post('/login', auth.login);
app.post('/logout', auth.logout);
app.get('/logout', auth.logout);
app.get('/login/success', auth.loginSuccess);
app.get('/login/failure', auth.loginFailure);
app.post('/register', auth.register);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
