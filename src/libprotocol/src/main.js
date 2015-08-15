module.exports.CreateSessionMessage = CreateSessionMessage;
module.exports.CloseSessionMessage = CloseSessionMessage;
module.exports.AddToHistoryMessage = AddToHistoryMessage;
module.exports.getMessage = getMessage;

module.exports.sendCreateSessionMessage = sendCreateSessionMessage;
module.exports.sendCloseSessionMessage = sendCloseSessionMessage;
module.exports.sendAddToHistoryMessage = sendAddToHistoryMessage;

var LOG_TAG = '[libprotocol]';
var MESSAGE_TYPE = {
    CREATE_SESSION: 'CreateSession',
    CLOSE_SESSION: 'CLoseSession',
    ADD_TO_HISTORY: 'AddToHistory'
};

function CreateSessionMessage() {
	console.log(LOG_TAG, "CreateSession");
	Message.call(this, MESSAGE_TYPE.CREATE_SESSION);
}
CreateSessionMessage.prototype = Object.create(Message.prototype);
CreateSessionMessage.prototype.constructor = CreateSessionMessage;

function CloseSessionMessage() {
	console.log(LOG_TAG, "CloseSession");
	Message.call(this, MESSAGE_TYPE.CLOSE_SESSION);
}
CloseSessionMessage.prototype = Object.create(Message.prototype);
CloseSessionMessage.prototype.constructor = CloseSessionMessage;

function AddToHistoryMessage(content) {
	console.log(LOG_TAG, "AddToHistory");
	Message.call(this, MESSAGE_TYPE.ADD_TO_HISTORY);
	this.content = content;
}
AddToHistoryMessage.prototype = Object.create(Message.prototype);
AddToHistoryMessage.prototype.constructor = AddToHistoryMessage;

function getMessage(msg) {
	console.log(msg);
	var msgSaved = msg.save();
	return JSON.stringify(msgSaved);
}


function Message(type) {
	this.type = type;
	this.time = Date.now();
}

Message.prototype.save = function () {
	switch(this.type) {
		case MESSAGE_TYPE.CREATE_SESSION:
		case MESSAGE_TYPE.CLOSE_SESSION:
			return {
                type: this.type,
				time: this.time
			};
		case MESSAGE_TYPE.ADD_TO_HISTORY:
			var event = this.content;
			return {
                type: this.type,
				time: this.time,
                target: event.target,
                value: event.value,
			    eventType: event.type,
			    which: event.which
			};
			
	}
};

Message.prototype.load = function (msg) {
	switch(msg.type) {
		case MESSAGE_TYPE.CREATE_SESSION:
			return new CreateSessionMessage();
		case MESSAGE_TYPE.CLOSE_SESSION:
			return new CloseSessionMessage();
		case MESSAGE_TYPE.ADD_TO_HISTORY:
			return new AddToHistoryMessage({
                target: msg.target,
                value: msg.value,
                eventType: msg.eventType,
                which: msg.which
			});
	}
}

function sendCreateSessionMessage(socket) {
	var msg = new CreateSessionMessage();
	socket.emit("message", getMessage(msg));
    return msg;
}
function sendCloseSessionMessage(socket) {
	var msg = new CloseSessionMessage();
	socket.emit("message", getMessage(msg));
    return msg;
}
function sendAddToHistoryMessage(socket, event, targetValue) {
	var content = {
        target: event.target,
        value: targetValue || '',
	    eventType: event.type,
        which: event.which
	};
	var msg = new AddToHistoryMessage(content);
	socket.emit("message", getMessage(msg));
    return msg;
}
