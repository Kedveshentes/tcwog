var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var CANNON = require('cannon');
var _ = require('underscore');

http.listen(process.env.PORT || 3000, function () {
  console.log('listening on', http.address().port);
});

http.listen(8010);


function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}


var Game = function () {
	this.utils = {
		timestamp : function () {
			return new Date().getTime();
		},
		springs   : {
			stiffness : 700,
			damping   : 30,
			maxLength : 7
		}
	};


	var previousTick = this.utils.timestamp(),
		frameRate = 60,
		dt = 0,
		now,
		step = 1/60,
		last = this.utils.timestamp();

	this.frame = function () {
		now = that.utils.timestamp();
		if (previousTick + (1000 / frameRate) < now) {
			previousTick = now;
			that.update();
		}
		if (now - previousTick < (1000 / frameRate) - 16) {
			setTimeout(that.frame);
		}
		else {
			setImmediate(that.frame);
		}
	};

	this.update = function () {
		this.world.step(step);

		_.each(this.objects.springs, function (spring) {
			spring.applyForce();
		});
	};

	this.reset = function () {
		this.init();
	};

	this.init = function () {
		this.initGameField();
		this.initObjects();
		this.frame();
	};

	this.addToGameWorld = function (addThis, color) {
		boxBody  = new CANNON.Body({ mass : 3, material : boxCannonMaterial });

        // var q = new CANNON.Quaternion();
        // q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        // boxBody.addShape(boxShape, new CANNON.Vec3(), q);
		boxBody.addShape(boxShape);


		boxBody.position.set(addThis.position.x, addThis.position.y, addThis.position.z);
		boxBody.color = color;
		this.objects.cubes.push({
			body : boxBody
		});
		this.world.add(boxBody);

		for (var i = 0; i < addThis.nearestCubes.length; i++) {
/*			createSpring(addThis.nearestCubes[i].index, this.objects.cubes.length - 1, addThis.nearestCubes[i].distance);
*/		}
	};

	
	var createSpring = function (index1, index2, restLength) {
		that.objects.springs.push(
			new CANNON.Spring(that.objects.cubes[index1].body, that.objects.cubes[index2].body, {
				localAnchorA : new CANNON.Vec3(0, 0, 0),
				localAnchorB : new CANNON.Vec3(0, 0, 0),
				restLength   : restLength || 5,
				stiffness    : that.utils.springs.stiffness,
				damping      : that.utils.springs.damping
			})
		);

		that.objects.lines.push({
			index1 : index1,
			index2 : index2
		});
	};

	var that = this;

	var solver;
	var groundMaterial;
	var groundShape;
	var groundBody;
	var planeMaterial;
	var planeShape;
	var planeRear;
	var planeFront;

	var boxCannonMaterial;
	var halfExtents;
	var boxBody;


	this.initGameField = function () {
		solver = new CANNON.GSSolver();
		this.world  = new CANNON.World();
		this.world.gravity.set(0, -20, 0);
		this.world.quatNormalizeSkip = 0;
		this.world.quatNormalizeFast = false;

		this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
		this.world.defaultContactMaterial.contactEquationRelaxation = 4;

		solver.iterations = 7;
		solver.tolerance = 0.1;
		split = true;
		if (split) {
			this.world.solver = new CANNON.SplitSolver(solver);
		}
		else {
			this.world.solver = solver;
		}

		this.world.broadphase = new CANNON.NaiveBroadphase();

		groundMaterial = new CANNON.Material();

		groundShape    = new CANNON.Plane();
		groundBody     = new CANNON.Body({ mass : 0 , material : groundMaterial });
		groundBody.addShape(groundShape);
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2);
		this.world.add(groundBody);


		planeMaterial = new CANNON.Material();
		planeShape    = new CANNON.Plane();

		planeRear     = new CANNON.Body({ mass: 0 , material : planeMaterial });
		planeRear.addShape(planeShape);
		planeRear.position.set(0, 0, -0.5);
		this.world.add(planeRear);

		planeFront    = new CANNON.Body({ mass: 0 , material : planeMaterial });
		planeFront.addShape(planeShape);
		planeFront.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), - Math.PI);
		planeFront.position.set(0, 0, 0.52);
		this.world.add(planeFront);
	};

	this.initObjects = function () {
		this.objects = {
			mouseIndicators : {},
			cubes           : [],
			springs         : [],
			lines           : []
		};

		halfExtents       = new CANNON.Vec3(0.5, 0.5, 0.5);


        // boxShape     = new CANNON.Cylinder(0.5, 0.5, 1, 4);
		boxShape          = new CANNON.Box(halfExtents);


		boxCannonMaterial = new CANNON.Material();
		
		var boxCannonMaterial_ground = new CANNON.ContactMaterial(groundMaterial, boxCannonMaterial, { friction: 1, restitution: 0 });
		this.world.addContactMaterial(boxCannonMaterial_ground);
		
		var boxCannonMaterial_boxCannonMaterial = new CANNON.ContactMaterial(boxCannonMaterial, boxCannonMaterial, { friction: 0.9, restitution: 0.5 });
		this.world.addContactMaterial(boxCannonMaterial_boxCannonMaterial);
		
		var boxCannonMaterial_planeMaterial = new CANNON.ContactMaterial(boxCannonMaterial, planeMaterial, { friction: 0, restitution: 0 });
		this.world.addContactMaterial(boxCannonMaterial_planeMaterial);


		for (var i = 0; i < 3; i++) {
			var x = 0;
			var y = 5 + i * 4;
			var z = 0;


			boxBody = new CANNON.Body({ mass : 3, material : boxCannonMaterial });
			boxBody.addShape(boxShape);
			this.world.add(boxBody);
			boxBody.position.set(x, y, z);
			this.objects.cubes.push({
				body : boxBody
			});
		}

		createSpring(0, 1);
		createSpring(1, 2);
		createSpring(2, 0);
	};

};


var game = new Game();
game.init();


function asd (socket) {
	var send = {
		cubes : []
	};
	for (var i = 0; i < game.objects.cubes.length; i++) {
		send.cubes.push({
			position : {
				x : Math.round(game.objects.cubes[i].body.position.x * 1000) / 1000,
				y : Math.round(game.objects.cubes[i].body.position.y * 1000) / 1000/*,
				z : Math.round(game.objects.cubes[i].body.position.z * 1000) / 1000*/
			},
			q        : game.objects.cubes[i].body.quaternion
		});
	}
	socket.emit('refresh', send);
}



io.on('connection', function (socket) {
	socket.color = 'rgb(' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ')';

	var send = {
		id    : socket.id,
		color : socket.color,
		cubes : [],
		lines : []
	};

	for (var i = 0; i < game.objects.cubes.length; i++) {
		send.cubes.push({
			position : {
				x : Math.round(game.objects.cubes[i].body.position.x * 1000) / 1000,
				y : Math.round(game.objects.cubes[i].body.position.y * 1000) / 1000/*,
				z : Math.round(game.objects.cubes[i].body.position.z * 1000) / 1000*/
			},
			q        : game.objects.cubes[i].body.quaternion,
			color    : game.objects.cubes[i].body.color
		});
		send.lines = game.objects.lines;
	}

	socket.emit('initialize', send);


	setInterval(function () {
		asd(socket);
	}, 33);

	socket.on('newCube', function (newCube) {
		game.addToGameWorld(newCube, socket.color);
		newCube.color = socket.color;
		io.sockets.emit('addCube', newCube);
	});

	socket.on('disconnect', function () {
		delete game.objects.mouseIndicators[socket.id];
		io.sockets.emit('deleteMouseIndicator', socket.id);
	});

	socket.on('reset', function () {
		game.reset();
		io.sockets.emit('reset');
	});

	socket.on('mouseIndicatorMove', function (mouseIndicatorPosition) {
		game.objects.mouseIndicators[socket.id] = {
			color     : socket.color,
			position  : mouseIndicatorPosition
		};
/*		socket.emit('myMouseMoved', game.objects.mouseIndicators[socket.id]);
*/		
		socket.broadcast.emit('mouseMoved', {id : socket.id , mouseIndicator : game.objects.mouseIndicators[socket.id]});
	});
});