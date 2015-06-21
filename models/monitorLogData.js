var mongoose = require('mongoose');
require('./projectModel');

var MonitorSchema = new mongoose.Schema({
	IsLenovoPreload: String,
	OS : String,
	Language : String,
	OSBit : String,
	GUID : String,
	DateTime : String,
	SecondXML : String,
	Day : { type: String, index: true},
	secondxml : String,
	LUVersion : String,
	LogType : String,
	PackageID : String,
	MT : String,
	ErrorCode: String,
	ReturnCode: String,
	ImportTime: String,
	Project: String
});

MonitorSchema.virtual('rawMT')
.get(function() {
	if (this.MT)
		return this.MT;
})

mongoose.model('MonitorLog', MonitorSchema);
