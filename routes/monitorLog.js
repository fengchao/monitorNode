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

router.get('/import', function(req,res){
	res.render('monitorImport');
});

var fs = require('fs');
var Busboy = require('busboy');
router.post('/import', function(req,res){
	var busboy = new Busboy({headers: req.headers});
	busboy.on('file', function (fieldname, file, filename) {
		console.log("Uploading:" + filename);
		fstream = fs.createWriteStream('../log_archive/monitor_log/' + filename);
		file.pipe(fstream);
	});
	busboy.on('finish', function() {
	   res.writeHead(200, { 'Connection': 'close' });
	   res.end("File uploaded.");
	});
	req.pipe(busboy);
});


module.exports = router;
