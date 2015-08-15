module.exports.CreateSession = CreateSession;
module.exports.CloseSession = CloseSession;
module.exports.AddToHistory = AddToHistory;
module.exports.readSession = readSession;
module.exports.obtainCookies = obtainCookies;


var WORK_MODE = {
	LOGGING: 'logging',
	REPLAY: 'replay'
};
module.exports.WORK_MODE = WORK_MODE;


var fs = require('fs');
var path = require('path');

var LOG_TAG = '[libhistory]'
var history = {};
var idTable = {};
var sessFilePaths = {};
var DEF_DIR_NAME = 'sessions';
var DEF_ENCODING = 'utf-8';

function getCurrentSessionId(socket) {
	return idTable[socket.id];
}

function createFileName(dirPath, sessId) {
	return path.join(dirPath, 'sess' + sessId + '.json');
}

function createDirName(userPath) {
	return userPath ? userPath : path.join(__dirname, DEF_DIR_NAME);
}

function createFilePath(sessId, userPath) {
    return userPath ? userPath : createFileName(createDirName(null), sessId);
}

function obtainCookies(parsedUrl, cookies) {
	if(parsedUrl.query.sessId) {
		cookies.push('workMode=' + WORK_MODE.REPLAY);
		cookies.push('sessId=' + parsedUrl.query.sessId);
	}
	else if(parsedUrl.pathname === '/'){
		cookies.push('workMode=' + WORK_MODE.LOGGING);
	}
}


function CreateSession(socket) {
	var sessId = Date.now();
	idTable[socket.id] = sessId;
	history[sessId] = [];
	return sessId;
}

function AddToHistory(socket, data) {
	var sessId = idTable[socket.id];
	history[sessId].push(data); 
}

function CloseSession(socket, userDirPath/*optional*/) {
	var sessDirPath = createDirName(userDirPath);

	fs.exists(sessDirPath, function (exists) {
		if(!exists) {
			fs.mkdir(sessDirPath, function(err) {
				if(!err) {
					writeSessionToFile(socket, sessDirPath);
				}
				else {
					console.warn(LOG_TAG, 'An error has occured while creating a directory', sessDirPath);
				}
			});
		}
		else {
			writeSessionToFile(socket, sessDirPath);
		}
	});//DANGER: high asyncrony zone %)
}

function writeSessionToFile(socket, sessDirPath) {
	var id = socket.id;
	var sessId = idTable[id];
	var sessFileName = createFileName(sessDirPath, sessId);

	sessFilePaths[sessId] = sessFileName;

	fs.open(sessFileName, 'w', function (err, fd) {
		if(!err) {
			fs.write(fd, JSON.stringify(history[sessId]), function (err, written, string) {
				if(err) {
					console.warn(LOG_TAG, 'An error occured while writing to a file', fd);
				}	
				else {
					console.log(LOG_TAG, written, 'bytes are successfully written', string);
				}
				
				delete idTable[id];
				delete history[sessId];
			});
		}
		else {
			console.warn(LOG_TAG, 'An error occured while accessing file', sessFileName);
			delete idTable[id];
			delete history[sessId];
		}	
	});
}

function readSession(sessId, callback/*(err, data)*/, options/*optional: 'path' is used only if searching by sessId has failed*/) {
	var userPath = options ? options.path : null;
	var filePath = sessFilePaths[sessId] ? sessFilePaths[sessId] : createFilePath(sessId, userPath);
	var optionsArg = {
		encoding: (options ? options.encoding : DEF_ENCODING)
	};

	fs.readFile(filePath, optionsArg, afterRead.bind(null, callback));

    function afterRead(callback, err, data) {
        callback(err, parseSessFile(data));
    }

}

function parseSessFile(data) {
    var result = JSON.parse(data);
    for(var i in result) {
        result[i] = JSON.parse(result[i]);
    }
    return result;
}


module.exports.getSessFilePaths = getSessFilePaths;
function getSessFilePaths() {
    return sessFilePaths;
}