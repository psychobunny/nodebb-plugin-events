"use strict";

$('document').ready(function() {
	//todo: experiment with pre-loading this info on ajaxify.start
	$(window).on('action:ajaxify.end', function(err, data) {
		var url = data.url, tid;

		if (tid = data.url.match(/^topic\/(\d*)/)) {
			tid = tid[1];

			$.get(RELATIVE_PATH + '/api/events/tid/' + tid, function(events) {
				for (var ev in events) {
					if (events.hasOwnProperty(ev)) {
						var data = {
							content: events[ev].content,
							timestamp: events[ev].timestamp,
							class: events[ev].class,
							avatar: events[ev].avatar,
							username: events[ev].username
						};

						templates.parse('events/topic', data, function(tpl) {
							translator.translate(tpl, function(content) {

								var rows = $('li.post-row');
								rows.each(function(idx) {
									var $this = $(this),
										nextRow = rows.eq(idx + 1),
										nextRowTimestamp = nextRow.attr('data-timestamp') ? nextRow.attr('data-timestamp') : data.timestamp + 1;

									console.log($this.attr('data-timestamp'), data.timestamp, nextRowTimestamp);
									if ($this.attr('data-timestamp') < data.timestamp && nextRowTimestamp > data.timestamp) {
										$(content).insertAfter($this).find('.timeago').timeago();
										return false;
									}
								});
							});
						});
					}
				}
			});
		}
	});
});