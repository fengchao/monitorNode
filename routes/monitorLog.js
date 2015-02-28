var express = require('express');
var router = express.Router();

require('../modules/monitorLogData');
var mongoose = require('mongoose');
var Validator = require('validator').Validator;

var monitorLog = mongoose.model('lu');

function validate(message) {
	var v= new Validator();
	var errors = [];

	v.error = function(msg) {
		errors.push(msg);
	};

	//v.check(message.email, 'Please enter a valid email address').isEmail();

	return errors;
}

router.get('/show', function (req,res){
	var message = req.body.message;
	var errors = validate(message);

	monitorLog.find({}, function (err, result) {
		res.render('monitorLog', {
			result : result
		});
	});
});

module.exports = router;
