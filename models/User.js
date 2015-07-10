var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;

var UserSchema = new mongoose.Schema({
    name: {type:String, required:true, trim:true},
    email: {type:String, required: true, trim: true, lowercase:true, unique: true},
    password: {type:String, required: true }
});

UserSchema.statics.localStrategy = new LocalStrategy(
	{
    	usernameField: 'email',
    	passwordField: 'password',
    	passReqToCallback: true
	},

	// @see https://github.com/jaredhanson/passport-local
	function (req, username, password, done)	{
		var User = require('./User');
		User.findOne({email: username}, function(err, user) {
			if (err) { return done(err); }

			if (!user){
				return done(null, false, req.flash('message', 'Invalid username or password.') );
			} 
			if (!user.validPassword(password)){
				return done(null, false, req.flash('message', 'Invalid username or password.') );
			}

			// I'm specifying the fields that I want to save into the user's session
			// *I don't want to save the password in the session
			return done(null, {
				id: user._id,
				name: user.name,
				email: user.email,
			});
		});
	}
);

UserSchema.methods.validPassword = function(password){
	if (this.password === password){
		return true;
	}

	return false;
};

UserSchema.statics.serializeUser = function(user, done){
	done(null, user);
};

UserSchema.statics.deserializeUser = function(obj, done){
	done(null, obj);
};

var model = mongoose.model('users', UserSchema);

exports = module.exports = model;
