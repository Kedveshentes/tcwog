var express = require('express'),
	CANNON  = require('cannon'),
	_       = require('underscore'),
	server  = require('http').createServer(app),
	io      = require('socket.io').listen(server),
	app     = express();

server.listen(8001);

var solver = new CANNON.GSSolver();



io.on('connection', function (socket) {
	console.log('Client connected, sending CANNON solver');
	socket.emit('cannon.solver', { solver : 'world' });
});

/*
io.sockets.on('connection', function (socket) {
	console.log('msg');
})*/