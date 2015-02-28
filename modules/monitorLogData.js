var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MonitorSchema = new Schema({
	os : String,
	language : String,
	guid : String,
	datetime : String,
	day : String,
	secondxml : String,
	mt : String,
	errorcode: String,
	returncode: String,
});

mongoose.model('lu', MonitorSchema,'lu');

mongoose.connect('mongodb://localhost:27017/db', function (error) {
	if (error) {
		console.log(error);
	}
});
