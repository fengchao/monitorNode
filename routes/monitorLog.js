var express = require('express');
var router = express.Router();
var fs = require('fs');

require('../modules/monitorLogData');
var mongoose = require('mongoose');
var Validator = require('validator').Validator;

var MonitorLog = mongoose.model('MonitorLog');

Date.prototype.yyyymmdd = function() {         
    
    var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};  

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
	var currentDay = new Date().yyyymmdd();
	
	var searchCallback = function (err, result) {
		res.render('monitorLog', {
			result : result,
			logDate: currentDay
		});
	};
	
	//MonitorLog.find({Day : currentDay}).sort('-DateTime').exec(searchCallback);
	MonitorLog.find().sort('DateTime').exec(searchCallback);
});

router.get('/import', function(req,res){
	res.render('monitorImport', {
			lines: "Imported file will show here".split('/\r?\n/')
		});
});

var fs = require('fs');
var Busboy = require('busboy');
var writeError = function (err) {
	if (err) {
		console.log(err);
	}
};

router.post('/import', function(req,res){
	var busboy = new Busboy({headers: req.headers});
	var targetFile;
	busboy.on('file', function (fieldname, file, filename) {
		console.log("Uploading:" + filename);
		targetFile = '../log_archive/monitor_log/' + filename;
		var fstream = fs.createWriteStream(targetFile);
		file.pipe(fstream);
	});
	busboy.on('finish', function() {
		fs.readFile(targetFile, 'utf8', function (err, data) {
			var lines = data.toString().split('\n');
			console.log("Lines: " + lines);
			for (var i =lines.length-1; i >= 0; i--) {
				console.log("Line[" + i + "]:" + lines[i]);
				
				if (lines[i].length < 5) {
					console.log("Skip. Line length is too short: " + lines[i].length);
					continue;
				}
				var monitorLog = new MonitorLog();
				var pairs = lines[i].split('&');
				for (var j = pairs.length - 1; j>=0; j--) {
					console.log("Pair:" + pairs[j]);
					var values = pairs[j].split('=');
					monitorLog[values[0]] = values[1];
					if (values[0] === 'DateTime') {
						monitorLog.Day = values[1].slice(0, 10);
					}
				}
				monitorLog.save(writeError);
			}
			res.render('monitorImport', {
				lines: data.toString().split('\n')
			});
			
		});
	});
	req.pipe(busboy);
});


module.exports = router;
