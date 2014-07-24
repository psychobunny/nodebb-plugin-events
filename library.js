"use strict";

var plugin = {},
	db = module.parent.require('./database'),
	user = module.parent.require('./user');


/*
* TODO: don't forget to add the topics/delete hook
*/

plugin.init = function(app, middleware, controllers) {
	console.log('nodebb-plugin-events: loaded');
};

plugin.topicPinned = function(data) {
	var tid = data.tid,
		isPinned = data.isPinned ? 'pinned' : 'unpinned',
		uid = data.uid,
		timestamp = data.timestamp;

	user.getUserFields(uid, ['username', 'userslug', 'picture'], function(err, data) {
		data = {
			content: translator.compile('events:topic.' + isPinned, data.userslug, data.username, timestamp),
			class: 'warning',
			timestamp: timestamp,
			avatar: data.picture,
			username: data.username
		};

		db.sortedSetAdd('topic:' + tid + ':events', timestamp, JSON.stringify(data));
	});	
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
	var tid = req.params.tid || 0;

	db.getSortedSetRevRange('topic:' + tid + ':events', 0, -1, function(err, raw) {
		var events = [];
		raw.forEach(function(data) {
			events.push(JSON.parse(data));
		});

		res.json(events);
	});

	/*var data = {};
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

	res.json(data);*/
};

module.exports = plugin;