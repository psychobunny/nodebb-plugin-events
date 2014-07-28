"use strict";

var plugin = {},
	db = module.parent.require('./database'),
	user = module.parent.require('./user'),
	async = module.parent.require('async'),
	categories = module.parent.require('./categories'),
	translator = module.parent.require('../public/src/translator');


/*
* TODO: don't forget to add the topics/delete hook
*/

plugin.init = function(app, middleware, controllers) {
	console.log('nodebb-plugin-events: loaded');
};

plugin.topicPinned = function(data) {
	var tid = data.tid,
		isPinned = data.isPinned,
		uid = data.uid,
		timestamp = data.timestamp;

	user.getUserFields(uid, ['username', 'userslug', 'picture'], function(err, userData) {
		var eventData = {
			eventType: 'pin',
			isPinned: isPinned,
			timestamp: timestamp,
			avatar: userData.picture,
			username: userData.username,
			userslug: userData.userslug
		};

		db.sortedSetAdd('topic:' + tid + ':events', timestamp, JSON.stringify(eventData));
	});	
};

plugin.topicLocked = function(data) {
	var tid = data.tid,
		isLocked = data.isLocked,
		uid = data.uid,
		timestamp = data.timestamp;

	user.getUserFields(uid, ['username', 'userslug', 'picture'], function(err, userData) {
		var eventData = {
			eventType: 'lock',
			isLocked: isLocked,
			timestamp: timestamp,
			avatar: userData.picture,
			username: userData.username,
			userslug: userData.userslug
		};

		db.sortedSetAdd('topic:' + tid + ':events', timestamp, JSON.stringify(eventData));
	});	
};

plugin.topicMoved = function(data) {
	var tid = data.tid,
		fromCid = data.fromCid,
		toCid = data.toCid,
		uid = data.uid,
		timestamp = data.timestamp;

	async.parallel({
		user: function(next) {
			user.getUserFields(uid, ['username', 'userslug', 'picture'], next);
		},
		categories: function(next) {
			categories.getCategoriesData([fromCid, toCid], next);
		}
	}, function(err, data) {
		var eventData = {
			eventType: 'move',
			timestamp: timestamp,
			avatar: data.user.picture,
			username: data.user.username,
			userslug: data.user.userslug,
			categories: {
				from: {
					name: data.categories[0].name,
					slug: data.categories[0].slug
				},
				to: {
					name: data.categories[1].name,
					slug: data.categories[1].slug
				}
			}
		};

		db.sortedSetAdd('topic:' + tid + ':events', timestamp, JSON.stringify(eventData));
	});
};

plugin.init = function(router, middleware, controllers, callback) {
	router.get('/api/events/tid/:tid', appendEvents);
	callback();
};

function appendEvents(req, res, next) {
	var tid = req.params.tid || 0;

	db.getSortedSetRange('topic:' + tid + ':events', 0, -1, function(err, raw) {
		var events = [];
		raw.forEach(function(data) {
			events.push(JSON.parse(data));
		});

		res.json(events);
	});
};

module.exports = plugin;