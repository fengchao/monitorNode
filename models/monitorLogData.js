var mongoose = require('mongoose');

var MonitorSchema = new mongoose.Schema({
	IsLenovoPreload: boolean,
	OS : String,
	Language : String,
	OSBit : String,
	GUID : String,
	DateTime : String,
	SecondXML : String,
	Day : { type: [String], index: true},
	secondxml : String,
	LUVersion : String,
	LogType : String,
	PackageID : String,
	MT : String,
	ErrorCode: String,
	ReturnCode: String,
});

mongoose.model('MonitorLog', MonitorSchema);

mongoose.connect('mongodb://localhost:27017/db', function (error) {
	if (error) {
		console.log(error);
	}
});
