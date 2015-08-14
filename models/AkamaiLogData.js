var mongoose = require('mongoose');
require('./projectModel');

var AkamaiSchema = new mongoose.Schema({
	Day : { type: String, index: true},
	URL: String,
	Completed : String,
	Initiated : String,
	EDGE_VOLUME : String,
	OK_EDGE_VOLUME : String,
	ERROR_EDGE_VOLUME : String,
	EDGE_HITS : String,
	OK_EDGE_HITS : String,
	ERROR_EDGE_HITS : String,
	R_0XX : String,
	R_2XX : String,
	R_200 : String,
	R_206 : String,
	R_3XX : String,
	R_302 : String,
	R_304 : String,
	R_4XX : String,
	R_404 : String,
	OFFLOADED_HITS : String,
	ORIGIN_HITS : String,
	ORIGIN_VOLUME : String,
	MT : String,
	Project: String
});

mongoose.model('AkamaiLog', AkamaiSchema);
