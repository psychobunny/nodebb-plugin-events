"use strict";

var plugin = {},
	db = module.parent.require('./database');

plugin.init = function(app, middleware, controllers) {
	console.log('nodebb-plugin-events: loaded');
};

plugin.topicPinned = function(data) {
	var tid = data.tid,
		isPinned = data.isPinned,
		uid = data.uid;

	db.sortedSetAdd('topic:' + tid + ':events', {});
};

plugin.topicLocked = function(data) {
	var tid = data.tid,
		isLocked = data.isLocked,
		uid = data.uid;
};

plugin.topicMoved = function(data) {
	var tid = data.tid,
		fromCid = data.fromCid,
		toCid = data.toCid,
		uid = data.uid;
};

plugin.init = function(router, middleware, controllers, callback) {
	router.get('/api/events/tid/:tid', appendEvents);
	callback();
};

function appendEvents(req, res, next) {
	console.log('HERE', req.params.tid);

	var data = {};
	data.events = [
		{
			timestamp: 1400266282577,
			class: 'warning',
			content: '[[events:topic.unpinned, psychobunny, 2014-05-16T18:55:22.572Z]]'
		},
		{
			timestamp: 1400266282575,
			class: 'success',
			content: '[[events:topic.pinned, psychobunny, 2014-05-16T18:55:22.572Z]]'
		}
	]

	res.json(data);
};

module.exports = plugin;