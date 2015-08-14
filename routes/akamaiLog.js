var express = require('express');
var router = express.Router();
var fs = require('fs');
var Busboy = require('busboy');

require('../models/AkamaiLogData');
var mongoose = require('mongoose');

var AkamaiLog = mongoose.model('AkamaiLog');

var maxItemsPerPage = 50;

String.prototype.startWith=function(str){
	var reg=new RegExp("^"+str);
	return reg.test(this);        
};

String.prototype.endWith=function(str){
	var reg=new RegExp(str+"$");
	return reg.test(this);        
};

router.get('/show', function (req,res){
	var Day = String(req.query.Day).replace(/(-*)/g,'');
	console.log("Day:", Day);
	var mt = req.query.mt;
	var errOnly = req.query.errOnly;
	
	var currentDay = new Date().yyyymmdd();
	
	var page = req.query.page && parseInt(req.query.page, 10) || 0;

	var searchCallback = function (err, results) {
		results.forEach(function (result) {
			result.Project = result.MT;
		});
		AkamaiLog.populate(results, {path: 'Project', model: 'projects'}, function (err, result) {
			res.render('AkamaiShow', {
				result : result,
				Day: Day,
				page : page,
				mt: mt,
			});
		});
	};
	
	var query = AkamaiLog.find().sort('-Completed');
	if (Day)
		query.where('Day').equals(Day);
	if (mt)
		query.where('MT').equals(mt);
	
	query.skip(page * maxItemsPerPage).limit(maxItemsPerPage).exec(searchCallback);
});

router.get('/import', function(req,res){
	res.render('akamaiImport', {
			lines: "Imported akamai log will be shown here".split('/\r?\n/')
		});
});

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
		
		// If file already exist, do not write again and set file to a notice.
		if (fs.existsSync('../log_archive/akamai_log/' + filename)) {
			targetFile = '../log_archive/akamai_log/Readme';
		} else {
			targetFile = '../log_archive/akamai_log/' + filename;
		}

		var wstream = fs.createWriteStream('../log_archive/akamai_log/' + filename);
		wstream.on('error', function(err) {
			console.log('Error:' + err);
		});
		wstream.on('close', function() {
			console.log("Write stream closed");
			fs.readFile(targetFile, 'utf8', function (err, data) {
				var lines = data.toString().split('\n');
				var importTime;
				var columeName = []; 
				for (var i = 0; i < lines.length; i++) {
					console.log("Line[" + i + "]:" + lines[i]);
					
					// Skip empty line
					var items = lines[i].split(',');
					if (items.length < 2) {
						continue;
					}

					if (items[0] === 'end_date') {
						importTime = items[1].trim();
						console.log("Date:" + items[0]);
					}
					
					if (items[0] === 'URL') {
						console.log("Colume Name:");
						for (var j = 0; j < items.length; j++) {
							columeName.push(items[j]);
							console.log(columeName[j]);
						}
					}

					if (items[0].startWith("lenovo.download.akamai.com")) {
						var akamaiLog = new AkamaiLog();
						
						// TODO: Auto detect if Excel format is changed or not
						akamaiLog.Day = importTime;
						akamaiLog.URL = items[0];
						akamaiLog.Completed = Number(items[2]);
						akamaiLog.Initiated = items[3];
						akamaiLog.EDGE_VOLUME = items[4];
						akamaiLog.OK_EDGE_VOLUME = items[5];
						akamaiLog.ERROR_EDGE_VOLUME = items[6];
						akamaiLog.EDGE_HITS = items[7];
						akamaiLog.OK_EDGE_HITS = items[8];
						akamaiLog.ERROR_EDGE_HITS = items[9];
						akamaiLog.R_0XX = items[10];
						akamaiLog.R_2XX = items[11];
						akamaiLog.R_200 = items[12];
						akamaiLog.R_206 = items[13];
						akamaiLog.R_3XX = items[14];
						akamaiLog.R_302 = items[15];
						akamaiLog.R_304 = items[16];
						akamaiLog.R_4XX = items[17];
						akamaiLog.R_404 = items[18];
						akamaiLog.OFFLOADED_HITS = items[19];
						akamaiLog.ORIGIN_HITS = items[20];
						akamaiLog.ORIGIN_VOLUME = items[21];
						akamaiLog.MT = items[22];
						akamaiLog.save(writeError);
					}
				}
				
				res.redirect('/akamai/import/result/' + importTime);
			});
		});
		file.pipe(wstream);
	});
	busboy.on('finish', function() {
		console.log("Upload finished.");
	});
	req.pipe(busboy);
});

router.get('/import/result/:time', function(req, res) {
	var showImported = function (err, result) {
		res.render('akamaiImport', {
			result : result,
		});
	};
	
	AkamaiLog.find({Day: req.params.time}).sort('-Completed').exec(showImported);
});

router.get('/summary', function(req,res){
	var summary = {};
	
	/* Deap Callback stack here. */
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
