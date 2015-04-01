var passport = require('passport');
var User = require('../models/User');

var AuthController = {

    // Show login form
    loginGet:  function(req, res){
		res.render('login', {});
    },
    
    // Login a user 
    login: passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
        failureFlash: 'Invalid username or password.',
    }),

    // on Login Success callback
    loginSuccess: function(req, res){
        res.json({
            success: true,
            user: req.session.passport.user
        });
    },

    // on Login Failure callback
    loginFailure: function(req, res){
        res.json({
            success:false, 
            message: 'Invalid username or password.'
        });
    },

    // Log out a user   
    logout: function(req, res){
        req.logout();
        res.render('login', {		});
    },

    register: function(req, res){
        User.create({name: req.body.name, email: req.body.email, password: req.body.password}, function(err){
          if (err) {
            console.log(err);
            res.redirect('/* Your error redirection path */');
            return;
          }

          res.redirect('/* Your success redirection path */'); 
        });
    },
};

exports = module.exports = AuthController;