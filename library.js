"use strict";

var plugin = {},
	async = module.parent.require('async'),
	db = module.parent.require('./database'),
	user = module.parent.require('./user'),
	plugins = module.parent.require('./plugins'),
	categories = module.parent.require('./categories'),
	translator = module.parent.require('../public/src/translator');


/*
* TODO: don't forget to add the topics/delete hook
*/


plugin.addEvent = function(eventType, typeID, eventName, timestamp, eventData) {
	var key = eventType + ':' + typeID + ':events';

	db.delete(key + ':' + eventName, function() {
		db.sortedSetRemove(key, eventName, function(err) {
			db.sortedSetAdd(key, timestamp, eventName);
			db.setObject(key + ':' + eventName, eventData);
		});
	});
};

plugin.getEvents = function(eventType, typeID, callback) {
	var key = eventType + ':' + typeID + ':events';

	db.getSortedSetRange(key, 0, -1, function(err, eventNames) {
		var events = [];
		async.eachSeries(eventNames, function(eventName, next) {
			db.getObject(key + ':' + eventName, function(err, data) {
				if (data !== null) {
					events.push(data);	
				}
				
				next(err);
			});
		}, function(err) {
			callback(err, events);
		});
	});
};

plugin.topicPinned = function(data) {
	var tid = data.tid,
		isPinned = data.isPinned,
		uid = data.uid,
		timestamp = data.timestamp;

	user.getUserFields(uid, ['username', 'userslug', 'picture'], function(err, userData) {
		var eventType = isPinned ? 'pinned' : 'unpinned',
			eventData = {
				eventType: eventType,
				timestamp: timestamp,
				picture: userData.picture,
				username: userData.username,
				userslug: userData.userslug
			};

		plugin.addEvent('topic', tid, eventType, timestamp, eventData);
	});	
};

plugin.topicLocked = function(data) {
	var tid = data.tid,
		isLocked = data.isLocked,
		uid = data.uid,
		timestamp = data.timestamp;

	user.getUserFields(uid, ['username', 'userslug', 'picture'], function(err, userData) {
		var eventType = isLocked ? 'locked' : 'unlocked',
			eventData = {
				eventType: eventType,
				timestamp: timestamp,
				picture: userData.picture,
				username: userData.username,
				userslug: userData.userslug
			};

		plugin.addEvent('topic', tid, eventType, timestamp, eventData);
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
				picture: data.user.picture,
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

		plugin.addEvent('topic', tid, 'moved:' + toCid, timestamp, eventData);
	});
};

plugin.init = function(router, middleware, controllers, callback) {
	router.get('/api/events/tid/:tid', listTopicEvents);
	callback();
};

function listTopicEvents(req, res, next) {
	var tid = req.params.tid || 0;

	plugin.getEvents('topic', tid, function(err, events) {
		res.json(events);
	});
}

module.exports = plugin;