"use strict";

$('document').ready(function() {
	//todo: experiment with pre-loading this info on ajaxify.start
	$(window).on('action:ajaxify.end', function(err, data) {
		var url = data.url, tid;

		if (tid = data.url.match(/^topic\/(\d*)/)) {
			tid = tid[1];

			getEventsData({tid: tid});
		}
	});

	$(window).trigger('action:posts.loaded', getEventsData);

	socket.on('event:topic_pinned', getEventsData);
	socket.on('event:topic_unpinned', getEventsData);
	socket.on('event:topic_locked', getEventsData);
	socket.on('event:topic_unlocked', getEventsData);
	socket.on('event:topic_moved', getEventsData);


	function getEventsData(data) {
		tid = data.tid || ajaxify.variables.get('topic_id');

		$.get(RELATIVE_PATH + '/api/events/tid/' + tid, function(events) {
			$.each(events, function(idx, data) {
				var timestamp = utils.toISOString(data.timestamp),
					userUrl = RELATIVE_PATH + '/users/' + data.userslug;

				switch (data.eventType) {
				case 'pin' :
					var str = 'events:topic.' + (data.isPinned ? 'pinned' : 'unpinned');

					data.content = translator.compile(str, userUrl, data.username, timestamp);
					data.class = data.isPinned ? 'success' : 'warning';
					break;
				case 'lock' :
					var str = 'events:topic.' + (data.isLocked ? 'locked' : 'unlocked');
					
					data.content = translator.compile(str, userUrl, data.username, timestamp);
					data.class = data.isLocked ? 'success' : 'warning';
					break;
				case 'move' :
					var from = data.categories.from,
						to = data.categories.to;

					data.content = translator.compile(str, userUrl, data.username, from.slug, from.name, to.slug, to.name, timestamp);
					data.class = 'info';
					break;
				default :
					return true;
				}

				if ($('.events-topic[data-timestamp="' + data.timestamp + '"]').length) {
					return true;
				}

				createEventRow(data, idx);
			});
		});
	}

	function createEventRow(data, idx) {
		templates.parse('events/topic', data, function(tpl) {
			translator.translate(tpl, function(content) {

				var rows = $('li.post-row');
				rows.each(function(idx) {
					var $this = $(this),
						nextRow = rows.eq(idx + 1),
						nextRowTimestamp = nextRow.attr('data-timestamp') ? nextRow.attr('data-timestamp') : data.timestamp + 1;

					if ($this.attr('data-timestamp') < data.timestamp && nextRowTimestamp > data.timestamp) {
						var contentEl;
						if (nextRow.length) {
							contentEl = $(content).insertBefore(nextRow);
						} else {
							contentEl = $(content).appendTo($this.parent());
						}

						contentEl.find('.timeago').timeago();

						// BEGIN: very lavender specific styling here. Not sure how this pans out on other themes.
						contentEl.prev().css('margin-bottom', '0px');
						if (!contentEl.next().length) {
							$('.bottom-post-bar').css('margin-top', '0px');
						} else {
							contentEl.next().css('margin-top', '0px');	
						}
						// END: very lavender specific styling here. Not sure how this pans out on other themes.
						
						return false;
					}
				});
			});
		});
	}
});