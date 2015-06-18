var express = require('express'),
	CANNON  = require('cannon'),
	_       = require('underscore'),
	server  = require('http').createServer(app),
	io      = require('socket.io').listen(server),
	app     = express();

server.listen(8002);

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
	this.objects = {
		cubes     : [],
		springs   : []
	};


	var createBridge = function (index1, index2, restLength) {
		that.objects.springs.push(
			new CANNON.Spring(that.objects.cubes[index1].body, that.objects.cubes[index2].body, {
				localAnchorA : new CANNON.Vec3(0, 0, 0),
				localAnchorB : new CANNON.Vec3(0, 0, 0),
				restLength   : restLength || 5,
				stiffness    : that.utils.springs.stiffness,
				damping      : that.utils.springs.damping
			})
		);
	};

	var that = this;

	var solver;
	var world;
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
		world  = new CANNON.World();
		world.gravity.set(0, -20, 0);
		world.quatNormalizeSkip = 0;
		world.quatNormalizeFast = false;

		world.defaultContactMaterial.contactEquationStiffness = 1e9;
		world.defaultContactMaterial.contactEquationRelaxation = 4;

		solver.iterations = 7;
		solver.tolerance = 0.1;
		split = true;
		if (split) {
			world.solver = new CANNON.SplitSolver(solver);
		}
		else {
			world.solver = solver;
		}

		world.broadphase = new CANNON.NaiveBroadphase();

		groundMaterial = new CANNON.Material();

		groundShape    = new CANNON.Plane();
		groundBody     = new CANNON.Body({ mass : 0 , material : groundMaterial });
		groundBody.addShape(groundShape);
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2);
		world.add(groundBody);


		planeMaterial = new CANNON.Material();
		planeShape    = new CANNON.Plane();

		planeRear     = new CANNON.Body({ mass: 0 , material : planeMaterial });
		planeRear.addShape(planeShape);
		planeRear.position.set(0, 0, -0.5);
		world.add(planeRear);

		planeFront    = new CANNON.Body({ mass: 0 , material : planeMaterial });
		planeFront.addShape(planeShape);
		planeFront.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), - Math.PI);
		planeFront.position.set(0, 0, 0.55);
		world.add(planeFront);

		/*this.solver         = solver;
		this.world          = world;
		this.groundMaterial = groundMaterial;
		this.groundShape    = groundShape;
		this.groundBody     = groundBody;
		this.planeMaterial  = planeMaterial;
		this.planeShape     = planeShape;
		this.planeRear      = planeRear;
		this.planeFront     = planeFront;*/


		halfExtents       = new CANNON.Vec3(0.5, 0.5, 0.5);
		boxShape          = new CANNON.Box(halfExtents);
		boxCannonMaterial = new CANNON.Material();
		
		var boxCannonMaterial_ground = new CANNON.ContactMaterial(groundMaterial, boxCannonMaterial, { friction: 1, restitution: 0 });
		world.addContactMaterial(boxCannonMaterial_ground);
		
		var boxCannonMaterial_boxCannonMaterial = new CANNON.ContactMaterial(boxCannonMaterial, boxCannonMaterial, { friction: 0.9, restitution: 0.5 });
		world.addContactMaterial(boxCannonMaterial_boxCannonMaterial);
		
		var boxCannonMaterial_planeMaterial = new CANNON.ContactMaterial(boxCannonMaterial, planeMaterial, { friction: 0, restitution: 0 });
		world.addContactMaterial(boxCannonMaterial_planeMaterial);


		this.frame();
	};
	this.initObjects = function () {
		for (var i = 0; i < 3; i++) {
			var x = 0;
			var y = i * 3;
			var z = 0;

			boxBody = new CANNON.Body({ mass : 3, material : boxCannonMaterial });
			boxBody.addShape(boxShape);
			world.add(boxBody);
			boxBody.position.set(x, y, z);
			this.objects.cubes.push({
				body : boxBody
			});
		}

		createBridge(0, 1);
		createBridge(1, 2);
		createBridge(2, 0);
	};
	this.init = function () {
		this.initGameField();
		this.initObjects();
	};

	this.addToGameWorld = function (addThis) {
		boxCannonMaterial = new CANNON.Material();
		boxShape = new CANNON.Box(halfExtents);
		boxBody  = new CANNON.Body({ mass : 3, material : boxCannonMaterial });
		boxBody.addShape(boxShape);
		boxBody.position = addThis.position;
		this.objects.cubes.push({
			body : boxBody
		});
		world.add(boxBody);

		/*for (var i = 0; i < addThis.nearestCubes.length; i++) {
			createBridge(addThis.nearestCubes[i].index, this.objects.cubes.length - 1, addThis.nearestCubes[i].distance);
		}*/
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
		// if we are more than 16 milliseconds away from the next tick
		if (now - previousTick < (1000 / frameRate) - 16) {
			setTimeout(that.frame);
		}
		else {
			setImmediate(that.frame);
		}

		/*now  = that.utils.timestamp();
		dt   = dt + Math.min(1, (now - last) / 1000);
		while (dt > step) {
			dt = dt - step;
			that.update(step);
		}
		that.render(dt);
		last = now;
		requestAnimationFrame(that.frame);*/
	};





	this.update = function () {
		world.step(step);

		_.each(this.objects.springs, function (spring) {
			spring.applyForce();
		});
	};
};













var game = new Game();
game.init();



function asd (socket) {
	var send = {
		cubes : []
	};
	for (var i = game.objects.cubes.length - 1; i >= 0; i--) {
		send.cubes.push({
			x : Math.round(game.objects.cubes[i].body.position.x * 100000) / 100000,
			y : Math.round(game.objects.cubes[i].body.position.y * 100000) / 100000,
			z : Math.round(game.objects.cubes[i].body.position.z * 100000) / 100000
		});
	}
	socket.emit('cannon', send);
}



io.on('connection', function (socket) {
	/*socket.emit('cannon', {
		// solver         : game.solver,
		// world          : game.world,
		// groundMaterial : game.groundMaterial,
		// groundShape    : game.groundShape,
		// groundBody     : game.groundBody,
		// planeMaterial  : game.planeMaterial,
		// planeShape     : game.planeShape,
		// planeRear      : game.planeRear,
		// planeFront     : game.planeFront
	});*/
	
	setInterval(function () {
		asd(socket);
	}, 16);

	socket.on('newCube', function (newCube) {
		game.addToGameWorld(newCube);
	});
});


/*io.sockets.on('connection', function (socket) {
	console.log('msg');
})*/