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
						var data = events[ev];

						switch (data.eventType) {
						case 'pin' :
							var str = 'events:topic.' + (data.isPinned ? 'pinned' : 'unpinned');
							data.content = translator.compile(str, RELATIVE_PATH + '/users/' + data.userslug, data.username, utils.toISOString(data.timestamp));
							data.class = data.isPinned ? 'success' : 'warning';
							break;
						default :
							continue;
						}


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
										$this.css('margin-bottom', '0px');
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