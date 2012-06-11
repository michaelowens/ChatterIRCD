/**
 * ChatterIRCD
 *
 * @author Michael Owens
 * @copyright 2012 Michael Owens
 */
var net = require('net'),
	debug = require('./debug').debug,
	clients = [],
	nicks = [];

Array.prototype.remove = function (value) {
	var l = this.length;
	for (var i = 0; i < l; i++) {
		if (this[i] === value) {
			return this.splice(i, 1);
		}
	}
};

debug.on();

var server = '127.0.0.1';

var client = function (socket) {
	var self = this;
	this.socket = socket;
	this.nick = null;
	this.user = {
		user: '',
		host: '',
		server: '',
		real: ''
	};
	
	this.sendRaw = function (data) {
		self.socket.write(data);
	};

	this.send = function (data, from) {
		var prefix = server;
		if (from) prefix = from.prefix;
		self.sendRaw(':' + prefix + ' ' + data + '\r\n');
	};
	
	this.prefix = function () {
		return self.nick + "!" + self.user.user + "@" + self.socket.remoteAddress;
	};
};

var ChatterIRCD = net.createServer(function (socket) {
	socket.setTimeout(0);
	socket.setEncoding('utf8');
	
	debug.log('new connection');
	var conn = new client(socket);
	
	socket.addListener('close', function (error) {
		debug.log('[' + conn.nick + '] Connection closed: ' + error);
		nicks.remove(conn.nick);
		clients.remove(conn);
	});
	
	socket.addListener('connect', function () {
		//conn.send('Please authenticate');
	});
	
	socket.addListener('data', function (data) {
		debug.log(data);
		var match = /^(\w+)\s+(.*)/.exec(data);
		if (!match) {
			debug.log('Cannot parse: ' + data);
			return;
		}
		var command = match[1].toUpperCase(),
			rest = match[2];
		//debug.log(command);
		//debug.log(rest);
		
		switch (command) {
			case 'NICK':
				if (rest.length > 30 || /^[a-zA-Z]([a-zA-Z0-9_\-\[\]\\`^{}]+)$/.exec(rest) == null) {
					conn.send('432 * ' + rest + ' :Unacceptable nick');
					return;
				}
				var l = nicks.length;
				for (var i = 0; i < l; i++) {
					if (nicks[i].toLowerCase() === rest.toLowerCase()) {
						conn.send('433 * ' + rest + ' :Nick in use');
						return;
					}
				}
				nicks.push(rest);
				conn.name = rest;
				clients.push(conn);
				conn.send('001 ' + conn.name + ' :Welcome to the server, ' + conn.name + '!');
				break;
				
			case 'USER':
				match = /^([^\s]+)\s+([^\s]+)\s+([^\s]+)(\s+:(.*))?$/.exec(rest);
				if (!match) return;
				conn.user =  {
					user: match[1],
					host: match[2],
					server: match[3],
					real: match[5]
				};
				break;
				
			case 'PING':
				conn.send('PONG ' + server);
				break;
				
			default:
				debug.log('Unhandled message: ' + data);
				conn.send('421 ' + command + ' :Unknown command');
				break;
		}
	});
});

ChatterIRCD.listen(6667, function () {
	console.log('Server initialized');
});