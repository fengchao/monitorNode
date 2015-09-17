var mongoose = require('mongoose');
require('./projectModel');

var AkamaiSchema = new mongoose.Schema({
	Day : { type: String, index: true},
	URL: String,
	Completed : Number,
	MT : String,
	Project: String,
	Initiated : Number,
	OK_EDGE_VOLUME : Number,
	ERROR_EDGE_VOLUME : Number,
	OK_EDGE_HITS : Number,
	R_0XX : Number,
	R_2XX : Number,
	R_200 : Number,
	R_206 : Number,
	R_3XX : Number,
	R_302 : Number,
	R_304 : Number,
	R_4XX : Number,
	R_404 : Number,
	Offloaded_Hits : Number,
	Origin_Hits : Number,
	Completed_percent : Number,
	Origin_OK_Volume : Number,
	Origin_Error_Volume : String
});

mongoose.model('AkamaiLog', AkamaiSchema);
