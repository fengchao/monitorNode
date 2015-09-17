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
	var Day = req.query.Day;
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
	
	var query = AkamaiLog.find();
	if (Day) {
		console.log("Day:", Day);
		query.where('Day').equals(Day);
	}
	
	if (mt) {
		query.where('MT').equals(mt);
	}
	
	query.sort('-Completed').skip(page * maxItemsPerPage).limit(maxItemsPerPage).exec(searchCallback);
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

var getMTfromUrl = function (url) {
	var items = url.split('/');
	var endItem = items.pop();
	if (endItem.endWith('_win7.xml') 
			|| endItem.endWith('_win8.xml')
			|| endItem.endWith('_win8.1.xml')
			|| endItem.endWith('_win1.xml'))
			|| endItem.endWith('_win10.xml')) {
		return endItem.split('_')[0];
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
				var dateStringOffset= '# HTTP Downloads URLs. Covers from '.length;
				var lines = data.toString().split('\n');
				var importTime; 
				for (var i = 0; i < lines.length; i++) {
					//console.log("Line[" + i + "]:" + lines[i]);
					
					if (lines[i].startWith('# HTTP Downloads URLs. Covers from')) {
						// Get date and format to YYYY-MM-DD format
						importTime = lines[i].substr(dateStringOffset, 10).replace(/\//g, "-");
						console.log("Date:" + importTime);
						continue;
					}
					
					if (lines[i].startWith("lenovo.download.akamai.com")) {
						var akamaiLog = new AkamaiLog();
						var items = lines[i].split(',');
						
						// TODO: Auto detect if Excel format is changed or not
						akamaiLog.Day = importTime;
						akamaiLog.URL = String(items[0]).replace(/(lenovo\.download\.akamai\.com\/ideapad\/windows\/liveupdate\/)/g,'');
						akamaiLog.OK_EDGE_HITS = items[1];
						akamaiLog.OK_EDGE_VOLUME = items[2];
						akamaiLog.ERROR_EDGE_VOLUME = items[3];
						akamaiLog.R_0XX = items[4];
						akamaiLog.R_200 = items[5];
						akamaiLog.R_206 = items[6];
						akamaiLog.R_2XX = items[7];
						akamaiLog.R_302 = items[8];
						akamaiLog.R_304 = items[9];
						akamaiLog.R_3XX = items[10];
						akamaiLog.R_404 = items[11];
						akamaiLog.R_4XX = items[12];
						akamaiLog.Offloaded_Hits = items[13];
						akamaiLog.Origin_Hits = items[14];
						akamaiLog.Initiated = items[15];
						akamaiLog.Completed = Number(items[16]);
						akamaiLog.Completed_percent = items[17];
						akamaiLog.Origin_OK_Volume = items[18];
						akamaiLog.Origin_Error_Volume = items [19];
						
						akamaiLog.MT = getMTfromUrl(akamaiLog.URL);
						
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
				
	AkamaiLog.aggregate(
			{$match: {URL: new RegExp('zip$',"i")}},                            // zip package only
			{$project: {_id:1, URL:1, Completed:1}},
			{$group: {_id: "$URL", TotalCompleted: {$sum: "$Completed"}}},      //
			{$sort: {TotalCompleted: -1}},
			function (err, result) {
				if (err) { console.log(err); }
				res.render('akamaiSummary', {
					DownloadSummary : result
				});
	});
});

module.exports = router;
