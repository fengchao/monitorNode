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

router.post('/import', function(req,res){
	if(req.files.filePic!='undefined'){ //如果有需要上传的文件
		var tempPath=req.files.filePic.path; //获取上传之后的文件路径
		fs.rename(tempPath,"F:\\TEST\\test\\1.jpg",function(err){  //将文件移动到你所需要的位置
			if(err){throw err}
			fs.fs.unlink(tempPath);	
		});
	}
	res.send("put");
});


module.exports = router;
