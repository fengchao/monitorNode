var mongoose = require('mongoose');

var ProjectSchema = new mongoose.Schema({
	_id : { type: String, index: true},
	name : String
});

mongoose.model('projects', ProjectSchema);