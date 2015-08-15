var libprotocol = require('libprotocol');
var WORK_MODE = require('libhistory').WORK_MODE;

var LOG_TAG = '[actionsLogger]';
var INTERVAL = 1000;


var socket = io("http://localhost:8080");
socket.on("connect", function () {
	console.log(LOG_TAG, "connected to server");
    var mode = getCookieByName('workMode');
    console.log(LOG_TAG, 'Work mode:', mode);
    switch(mode) {
        case WORK_MODE.LOGGING:
            logActions();
            break;
        case WORK_MODE.REPLAY:
            replayActions();
            break;
        default:
            console.warn(LOG_TAG, 'Unknown value of \'workMode\' cookie', mode);
            break;
    }

	socket.on("message", function (data) {
		console.log(LOG_TAG, "A new message from server:", data);
	});

	socket.on("disconnect", function () {
		console.log(LOG_TAG, "server disconnected");
	});
});



function logActions() {
	socket.emit(WORK_MODE.LOGGING);

    var actionsLog = [];
	$("body").on("click keydown", function (event) {
        var targetValue = $(event.target).val();
		var msg = libprotocol.sendAddToHistoryMessage(socket, event, targetValue);
        actionsLog.push(msg);
    });

	$("#repeatButton").on("click", function(event) {
		showActionsLog(null, actionsLog);
		event.stopPropagation();
	});
}



function replayActions() {
	var sessId = getCookieByName('sessId');
	socket.emit(WORK_MODE.REPLAY, sessId, showActionsLog);
}

function getCookieByName(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if(parts.length === 2) {
        return parts.pop().split('; ').shift();
    }

    socket.emit('message', 'failed to get the cookie named' + name);
    return null;
}

function showActionsLog(err, actionsLog) {
    if (err) {
        console.warn(LOG_TAG, 'Error while trying to replay actions');
        return;
    }

    for (var i in actionsLog) {
        var event = actionsLog[i].content;

        setTimeout(function (event) {
            console.log(LOG_TAG, 'event', event);
            switch (event.eventType) {
                case 'click':
                    console.log('click');
                    $(event.target).trigger(event.eventType);
                    break;
                case 'keydown':
                    console.log('keydown');
                    $(event.target).val(event.value);
                    break;
                default:
                    console.log(event.eventType);
                    break;
            }
        }, INTERVAL, event);
    }
}
