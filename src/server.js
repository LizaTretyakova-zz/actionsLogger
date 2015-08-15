var httpServer = require('http').createServer(handler);
var io = require('socket.io')(httpServer);
var fs = require('fs');
var path = require('path');
var libhistory = require('libhistory');
var url = require('url');
var WORK_MODE = libhistory.WORK_MODE;


var DEF_FILE_TO_LOAD = '/index.html';
var LOG_TAG = '[server]';

httpServer.listen(8080);

function handler(request, response) {
	var parsedUrl = url.parse(request.url, true);
	var filename = parsedUrl.pathname === '/' ?
                        path.join(__dirname, DEF_FILE_TO_LOAD) :
                        path.join(__dirname, parsedUrl.pathname);
	var cookies = [];
    libhistory.obtainCookies(parsedUrl, cookies);

	fs.readFile(filename, callback.bind(null, cookies));

	function callback(cookies, err, data) {
		if(err) {
			response.writeHead(500);
			response.end('Error loading file', filename);
            console.warn(LOG_TAG, 'an error occured while reading file', err);
        }
		else {
            response.setHeader('Set-Cookie', cookies);
            response.writeHead(200);
            response.end(data);
            console.log(LOG_TAG, 'Sent cookies:', cookies);
        }
	}
}


io.on('connection', function(socket) {
    console.log(LOG_TAG, 'a client connected');


    socket.on(WORK_MODE.LOGGING, function () {
        var sessId = libhistory.CreateSession(socket);
        var timeSinceLastMessage = 0;

        socket.on('message', function(data) {
            timeSinceLastMessage = 0;
            console.log(LOG_TAG, 'new message for', sessId, ':', data);
            libhistory.AddToHistory(socket, data);
        });

        socket.on('disconnect', function () {
            console.log(LOG_TAG, sessId, 'disconnected');
            libhistory.CloseSession(socket);
            console.log(LOG_TAG, libhistory.getSessFilePaths());
        });
    });


    socket.on(WORK_MODE.REPLAY, function (sessId, callback/*(err, actionsLog)*/) {
        libhistory.readSession(sessId, callback);

        socket.on('disconnect', function() {
            console.log(LOG_TAG, 'a client disconnected');
            console.log(LOG_TAG, libhistory.getSessFilePaths());
        });
    });
});
