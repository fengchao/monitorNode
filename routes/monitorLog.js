var express = require('express');
var router = express.Router();
var fs = require('fs');
var Busboy = require('busboy');

require('../models/monitorLogData');
var mongoose = require('mongoose');
var Validator = require('validator').Validator;

var MonitorLog = mongoose.model('MonitorLog');

Date.prototype.yyyymmdd = function() {         
    
    var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
}; 

//对Date的扩展，将 Date 转化为指定格式的String
//月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
//年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
//例子： 
//(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
//(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
 var o = {
     "M+": this.getMonth() + 1, //月份 
     "d+": this.getDate(), //日 
     "h+": this.getHours(), //小时 
     "m+": this.getMinutes(), //分 
     "s+": this.getSeconds(), //秒 
     "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
     "S": this.getMilliseconds() //毫秒 
 };
 if (/(y+)/.test(fmt)) 
	 fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
 for (var k in o)
	 if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
 return fmt;
}

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
	
	MonitorLog.find().sort('-DateTime').limit(200).exec(searchCallback);
});

router.get('/import', function(req,res){
	res.render('monitorImport', {
			lines: "Imported file will show here".split('/\r?\n/')
		});
});


var writeError = function (err) {
	if (err) {
		console.log(err);
	}
};

router.get('/import/result/:time', function(req, res) {
	var importCallback = function (err, result) {
		res.render('monitorImport', {
			result : result,
		});
	};
	
	MonitorLog.find({ImportTime: req.params.time}).sort('-DateTime').exec(importCallback);
});

router.post('/import', function(req,res){
	var busboy = new Busboy({headers: req.headers});
	var targetFile;
	busboy.on('file', function (fieldname, file, filename) {
		console.log("Uploading:" + filename);
		
		// If file already exist, do not write again and set file to a notice.
		if (fs.existsSync('../log_archive/monitor_log/' + filename)) {
			targetFile = '../log_archive/monitor_log/Readme';
		} else {
			targetFile = '../log_archive/monitor_log/' + filename;
		}

		var wstream = fs.createWriteStream('../log_archive/monitor_log/' + filename);
		wstream.on('error', function(err) {
			console.log('Error:' + err);
		});
		wstream.on('close', function() {
			console.log("Write stream closed");
			fs.readFile(targetFile, 'utf8', function (err, data) {
				var lines = data.toString().split('\n');
				var importTime = new Date().Format("yyyy-MM-dd hh:mm:ss"); 
				for (var i =lines.length-1; i >= 0; i--) {
					console.log("Line[" + i + "]:" + lines[i]);
					
					if (lines[i].length < 25) {
						console.log("Skip. Line length is too short: " + lines[i].length);
						continue;
					}
					var monitorLog = new MonitorLog();
					var pairs = lines[i].split('&');
					for (var j = pairs.length - 1; j>=0; j--) {
						//console.log("Pair:" + pairs[j]);
						var values = pairs[j].split('=');
						monitorLog[values[0]] = values[1];
						if (values[0] === 'DateTime') {
							monitorLog.Day = values[1].slice(0, 10);
						}
					}
					monitorLog.ImportTime = importTime;
					monitorLog.save(writeError);
				}
				
				res.redirect('/monitorlog/import/result/' + importTime);
			});
		});
		file.pipe(wstream);
	});
	busboy.on('finish', function() {
		console.log("Upload finished.");
	});
	req.pipe(busboy);
});

router.get('/summary', function(req,res){
	var summary = {};
	
	/* Callback deep stakc here. */
	 MonitorLog.count({}, function (err, count) {
		summary.totalRec = count;
		MonitorLog.count({ErrorCode: 0}, function (err, count) {
			summary.successRec = count;
			MonitorLog.count({ErrorCode: {$ne: "0"}}, function (err, count) {
				summary.failRec = count;
				summary.date = new Date().Format("yyyy-MM-dd");
				
				MonitorLog.aggregate(
					{$group: {_id: "$ErrorCode", count: {$sum: 1}}},
					{$project: {_id:1, ErrorCode:1, count:1}},
					{$sort: {count: -1}},
					function (err, result) {
						if (err) { console.log(err); }
						res.render('monitorSummary', {
							summary: summary,
							errorSummary : result
						});
					});
			});
		});
	 });


	

});

module.exports = router;
