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
		timestamp = Date.now();

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
		timestamp = Date.now();

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
		timestamp = Date.now();

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
				fromCategoryName: data.categories[0].name,
				fromCategorySlug: data.categories[0].slug,
				toCategoryName: data.categories[1].name,
				toCategorySlug: data.categories[1].slug
			};

		plugin.addEvent('topic', tid, 'moved:' + toCid, timestamp, eventData);
	});
};

plugin.userFollowed = function(data) {
	var toUid = data.toUid,
		fromUid = data.fromUid,
		timestamp = Date.now();

	user.getMultipleUserFields([toUid, fromUid], ['username', 'userslug', 'picture'], function(err, data) {
		var eventData = {
				eventType: 'following',
				timestamp: timestamp,
				toUsername: data[0].username,
				toSlug: data[0].userslug,
				toPicture: data[0].picture,
				fromUsername: data[1].username,
				fromSlug: data[1].userslug,
				fromPicture: data[1].picture
			};

		plugin.addEvent('user', fromUid, 'following:' + toUid, timestamp, eventData);


		eventData.toUsername = data[1].username,
		eventData.toSlug = data[1].userslug,
		eventData.toPicture = data[1].picture,
		eventData.fromUsername = data[0].username,
		eventData.fromSlug = data[0].userslug,
		eventData.fromPicture = data[0].picture
		eventData.eventType = 'followed';

		plugin.addEvent('user', toUid, 'followed:' + fromUid, timestamp, eventData);
	});
};

plugin.init = function(data, callback) {
	data.router.get('/api/events/tid/:tid', listTopicEvents);
	data.router.get('/api/events/uid/:uid', listUserEvents);
	callback();
};

function listTopicEvents(req, res, next) {
	var tid = req.params.tid || 0;

	plugin.getEvents('topic', tid, function(err, events) {
		res.json(events);
	});
}

function listUserEvents(req, res, next) {
	var uid = req.params.uid || 0;

	plugin.getEvents('user', uid, function(err, events) {
		res.json(events);
	});
}

module.exports = plugin;
