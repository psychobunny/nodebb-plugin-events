# Topic Events plugin for NodeBB

Catches events such as topic pinned/unpinned, locked/unlocked, and moved. Adds a small notification inline within the thread, with the moderator's picture, username, brief description of the event, and timestamp.

## Installation

    npm install nodebb-plugin-events


## Adding custom events in your own plugin

Server side:

	/*
	*  eventType: topic / user
	*  typeID: tid or uid
	*  eventName: only the most recent of this will be recorded, the previous will be deleted
	*  eventData: things that you want to pass along to your template
	*/
	plugins.fireHook('action:event.add', eventType, typeID, eventName, timestamp, eventData);


## Screenshots

![](http://i.imgur.com/7XRmnU6.png)
![](http://i.imgur.com/tixqP1Q.png)