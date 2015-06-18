
var Game = function () {
	this.utils = {
		timestamp   : function () {
			return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
		},
		springs     : {
			stiffness : 700,
			damping   : 30,
			maxLength : 7
		}
	};

	var that        = this,
		dt          = 0,
		step        = 1/60,
		last        = this.utils.timestamp(),
		fpsmeter    = new FPSMeter(document.getElementById('fpsmeter'), { decimals: 0, graph: true, theme: 'dark', left: '5px' }),
		pressedKeys = [],
		mouse       = new THREE.Vector2();

	this.addToGameScene = function (addThis) {
		scene.add(addThis);
	};

	this.removeFromGameScene = function (removeThis) {
		scene.remove(removeThis);
	};


	this.createBridge = function (index1, index2, restLength) {
		var material,
			geometry,
			line;

		material = new THREE.LineBasicMaterial({
			color : 0x99ffff
		});
		geometry = new THREE.Geometry();
		geometry.vertices.push(that.objects.showMe[index1].mesh.position);
		geometry.vertices.push(that.objects.showMe[index2].mesh.position);
		line = new THREE.Line(geometry, material);

		that.objects.lines.push({
			material  : material,
			geometry  : geometry,
			mesh      : line,
			box1      : index1,
			box2      : index2
		});
		scene.add(line);
	};


	var scene,
		camera,
		renderer,
		spotlight;

	var raycaster,
		mouseIndicatorEnabled,
		distances;

	var gameBoxGeometry,
		gameBoxMaterial,
		gameBox;

	var gameFieldGeometry,
		gameFieldMaterial,
		gameField;

	var gameFieldRearGeometry,
		gameFieldRearMaterial,
		gameFieldRear;

	var obstacleGeometry,
		obstacleMaterial,
		obstacle;

	var solver,
		split;

	var springs;

	var groundMaterial,
		groundShape,
		groundBody;

	var planeMaterial,
		planeShape,
		planeRear,
		planeFront;

	var boxShape,
		boxCannonMaterial;

	this.initGameField = function () {
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x000000, 0, 500);

		camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.translateX(0);
		camera.translateY(20);
		camera.translateZ(30);

		renderer = new THREE.WebGLRenderer();
		renderer.shadowMapType = THREE.PCFSoftShadowMap;
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color, 1);


		/*gameBoxGeometry = new THREE.BoxGeometry(50, 50, 50);
		gameBoxMaterial = new THREE.MeshLambertMaterial({ color : 0x669999 , side : THREE.BackSide });
		gameBox         = new THREE.Mesh(gameBoxGeometry, gameBoxMaterial);
		gameBox.receiveShadow = true;
		scene.add(gameBox);
*/

		gameFieldGeometry = new THREE.PlaneBufferGeometry(70, 6, 50, 50);
		gameFieldGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));
		gameFieldMaterial = new THREE.MeshLambertMaterial({ color : 0xaaaaaa });
		gameField         = new THREE.Mesh(gameFieldGeometry, gameFieldMaterial);

		gameField.position.z    = 3;
		gameField.castShadow    = true;
		gameField.receiveShadow = true;
		scene.add(gameField);


		gameFieldRearGeometry = new THREE.PlaneBufferGeometry(70, 40, 50, 50);
		gameFieldRearMaterial = new THREE.MeshLambertMaterial({ color : 0xccccff });
		gameFieldRear         = new THREE.Mesh(gameFieldRearGeometry, gameFieldRearMaterial);

		gameFieldRear.position.y    = 20;
		gameFieldRear.position.z    = -0.1;
		gameFieldRear.castShadow    = true;
		gameFieldRear.receiveShadow = true;
		scene.add(gameFieldRear);

		obstacleGeometry = new THREE.CylinderGeometry(3, 3, 0.8, 32);
		obstacleMaterial = new THREE.MeshLambertMaterial({ color : 0xff2255 , transparent : true , opacity : 0.5 });
		obstacle         = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
		obstacle.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

		obstacle.position.y = 14;
		scene.add(obstacle);

		var ambientLight;
		ambientLight = new THREE.AmbientLight(0x222222);
		scene.add(ambientLight);


		spotlight = new THREE.SpotLight(0xffffff);
		spotlight.position.set(-15, 60, 14);
		spotlight.shadowMapWidth      = 1024;
		spotlight.shadowMapHeight     = 1024;
		spotlight.shadowCameraNear    = 10;
		spotlight.shadowCameraFov     = 50;
		spotlight.shadowDarkness      = 0.95;
		spotlight.intensity           = 1.6;
		spotlight.castShadow          = true;
		scene.add(spotlight);

		raycaster = new THREE.Raycaster();
	};


	this.initObjects = function () {
		this.objects = {
			mouseIndicators : {},
			showMe          : [],
			cubes           : [],
			lines           : [],
			springs         : [],
			obstacles       : []
		};

		var mouseIndicatorMaterial = new THREE.MeshLambertMaterial({ color : 0xffdddd }),
			mouseIndicatorGeometry = new THREE.BoxGeometry(1, 1, 1),
			mouseIndicator         = new THREE.Mesh(mouseIndicatorGeometry, mouseIndicatorMaterial);

		game.objects.mouseIndicators[this.mySocketId] = mouseIndicator;
		scene.add(game.objects.mouseIndicators[this.mySocketId]);

		mouseIndicatorEnabled = false;

		distances = [];

		this.nearestCubes = [];
		for (var i = 0; i <= 2; i++) {
			var material,
				geometry,
				line;

			material = new THREE.LineBasicMaterial({ color : 0x66ffff });
			geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(10, 0, 0));
			geometry.vertices.push(new THREE.Vector3(-10, 0, 10));
			line     = new THREE.Line(geometry, material);

			this.nearestCubes.push({
				distance : undefined,
				index    : undefined,
				line     : line
			});

			scene.add(this.nearestCubes[i].line);
		}
	};

	this.handleKeyUp = function (event) {
		pressedKeys[event.keyCode] = false;
	};
	this.handleKeyDown = function (event) {
		pressedKeys[event.keyCode] = true;
	};
	this.handleKeys = function () {
		if (pressedKeys[32]) {
			socket.emit('reset');
		}
		/*if (pressedKeys[33]) {
			// Page Up
			z -= 0.05;
		}
		if (pressedKeys[34]) {
			// Page Down
			z += 0.05;
		}
		if (pressedKeys[37]) {
			// Left cursor key
			this.objects.cubes[0].position.x += -0.4;
		}
		if (pressedKeys[39]) {
			// Right cursor key
			this.objects.cubes[0].position.x -= -0.4;
		}
		if (pressedKeys[38]) {
			// Up cursor key
			this.objects.cubes[0].position.z += -0.4;
		}
		if (pressedKeys[40]) {
			// Down cursor key
			this.objects.cubes[0].position.z -= -0.4;
		}*/
	};

	this.handleMouseMove = function (event) {
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	};
	this.handleMouseClick = function (event) {
		if (mouseIndicatorEnabled && that.nearestCubes[0].distance <= that.utils.springs.maxLength && that.nearestCubes[1].distance <= that.utils.springs.maxLength) {
			var data = {};

			data.position = that.objects.mouseIndicators[that.mySocketId].position;
			data.nearestCubes = [];

			for (var i = 0; i < that.nearestCubes.length; i++) {
				if (that.nearestCubes[i].index != undefined) {
					data.nearestCubes.push({
						distance : that.nearestCubes[i].distance,
						index    : that.nearestCubes[i].index   
					});
				}
			}
			socket.emit('newCube', data);
		}
	};


	this.update = function (step) {
		this.handleKeys();

		var objectsToCheck = [];

		objectsToCheck.push(gameFieldRear);
		objectsToCheck.push(obstacle);

		raycaster.setFromCamera(mouse, camera);
		var intersection = raycaster.intersectObjects(objectsToCheck);

		if (intersection.length != 0 && intersection.length < 2) {
			mouseIndicatorEnabled = true;
			socket.emit('mouseIndicatorMove', {
				x : intersection[0].point.x,
				y : intersection[0].point.y,
				z : intersection[0].point.z
			});
		} else {
			mouseIndicatorEnabled = false;
		}

		if (mouseIndicatorEnabled) {
			this.objects.mouseIndicators[this.mySocketId].visible = true;
		} else {
			this.objects.mouseIndicators[this.mySocketId].visible = false;
		}

/*  REFRESH LINES ACCORDING TO THEIR ENDPOINT BOXES  */
		for (var i = 0; i < this.objects.lines.length; i++) {
			/*this.objects.lines[i].mesh.geometry.vertices[0].set(this.objects.showMe[this.objects.lines[i].box1].mesh.position);
			this.objects.lines[i].mesh.geometry.vertices[1].set(this.objects.showMe[this.objects.lines[i].box2].mesh.position);*/
			this.objects.lines[i].mesh.geometry.verticesNeedUpdate = true;
		}
/* / REFRESH LINES ACCORDING TO THEIR ENDPOINT BOXES */

		for (var i = 0; i < this.objects.showMe.length; i++) {
/*  LOOKING FOR THE 2 NEAREST BOXES  */
			var dx = this.objects.showMe[i].mesh.position.x - this.objects.mouseIndicators[this.mySocketId].position.x,
				dy = this.objects.showMe[i].mesh.position.y - this.objects.mouseIndicators[this.mySocketId].position.y,
				dz = this.objects.showMe[i].mesh.position.z - this.objects.mouseIndicators[this.mySocketId].position.z;

			distances.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
			this.objects.showMe[i].mesh.material.transparent = false;
		}

		var distancesMin,
			distancesMinIndex;

		for (var i = 0; i <= 2; i++) {
			distancesMin      = _.min(distances);
			distancesMinIndex = _.indexOf(distances, distancesMin);

			if (mouseIndicatorEnabled && distancesMin <= this.utils.springs.maxLength) {
				var material,
					geometry,
					line;

				material = new THREE.LineBasicMaterial({
					color : 0x66ffff
				});
				geometry = new THREE.Geometry();
				geometry.vertices.push(this.objects.showMe[distancesMinIndex].mesh.position);
				geometry.vertices.push(game.objects.mouseIndicators[this.mySocketId].position);
				line = new THREE.Line(geometry, material);

				this.nearestCubes[i].line.visible = true;
				this.nearestCubes[i].line.geometry.vertices[0].set(this.objects.showMe[distancesMinIndex].mesh.position.x, this.objects.showMe[distancesMinIndex].mesh.position.y, this.objects.showMe[distancesMinIndex].mesh.position.z);
				this.nearestCubes[i].line.geometry.vertices[1].set(game.objects.mouseIndicators[this.mySocketId].position.x, game.objects.mouseIndicators[this.mySocketId].position.y, game.objects.mouseIndicators[this.mySocketId].position.z);
				this.nearestCubes[i].line.geometry.verticesNeedUpdate = true;

				this.nearestCubes[i].distance = distancesMin;
				this.nearestCubes[i].index    = distancesMinIndex;
			} else {
				this.nearestCubes[i].line.visible = false;
				this.nearestCubes[i].distance = undefined;
				this.nearestCubes[i].index    = undefined;
			}

			distances[distancesMinIndex] = Infinity;
		}

		distances = [];
/* / LOOKING FOR THE 2 NEAREST BOXES */
	};

	this.render = function () {
		renderer.render(scene, camera);
	};

	this.frame = function () {
		fpsmeter.tickStart();
		now  = that.utils.timestamp();
		dt   = dt + Math.min(1, (now - last) / 1000);
		while (dt > step) {
			dt = dt - step;
			that.update(step);
			fpsmeter.tick();
		}
		that.render(dt);
		last = now;
		requestAnimationFrame(that.frame);
	};

	this.init = function () {
		this.initGameField();
		this.initObjects();

		raycaster = new THREE.Raycaster();

		renderer.setSize(window.innerWidth, window.innerHeight);

		document.body.appendChild(renderer.domElement);
		document.onkeyup     = this.handleKeyUp;
		document.onkeydown   = this.handleKeyDown;
		document.onmousemove = this.handleMouseMove;
		document.onclick     = this.handleMouseClick;
		
		this.frame();
	};

	this.reset = function () {
		for (var i = 3; i < this.objects.showMe.length; i++) {
			this.removeFromGameScene(this.objects.showMe[i].mesh);
		}
		for (var i = 3; i < this.objects.lines.length; i++) {
			this.removeFromGameScene(this.objects.lines[i].mesh);
		}
	};
};

var game = new Game();

var socket = io(location.origin);

socket.on('cannon', function (data) {
	for (var i = 0; i < data.cubes.length; i++) {
		if (!game.objects.showMe[i]) {
			var showMeMaterial = new THREE.MeshLambertMaterial({ color : new THREE.Color(data.cubes[i].color) || 0xffffff }),
				showMeGeometry = new THREE.BoxGeometry(1, 1, 1),
				showMe         = new THREE.Mesh(showMeGeometry, showMeMaterial);

			game.addToGameScene(showMe);
			game.objects.showMe.push({
				mesh : showMe
			});
		}
		game.objects.showMe[i].mesh.position.copy(data.cubes[i].position);
		game.objects.showMe[i].mesh.quaternion.copy(data.cubes[i].q);
	}

	for (var i = 0; i < data.lines.length; i++) {
		if (!game.objects.lines[i]) {
			game.createBridge(data.lines[i].index1, data.lines[i].index2);
		}
	}
});

socket.on('deleteMouseIndicator', function (socketId) {
	game.removeFromGameScene(game.objects.mouseIndicators[socketId]);
	delete game.objects.mouseIndicators[socketId];
});

socket.on('mouseMoved', function (mouseIndicators) {
	for(property in mouseIndicators) {
		if (game.objects.mouseIndicators.hasOwnProperty(property)) {
			game.objects.mouseIndicators[property].position.set(mouseIndicators[property].position.x, mouseIndicators[property].position.y, mouseIndicators[property].position.z);
			game.objects.mouseIndicators[property].material.color = new THREE.Color(mouseIndicators[property].color);
			game.objects.mouseIndicators[property].material.transparent = true;
			game.objects.mouseIndicators[property].material.opacity = 0.5;
		} else {
			var mouseIndicatorMaterial = new THREE.MeshLambertMaterial({ color : new THREE.Color(mouseIndicators[property].color) , opacity : 0.5 , transparent : true }),
				mouseIndicatorGeometry = new THREE.BoxGeometry(1, 1, 1),
				mouseIndicator         = new THREE.Mesh(mouseIndicatorGeometry, mouseIndicatorMaterial);

			mouseIndicator.position.set(mouseIndicators[property].position.x, mouseIndicators[property].position.y, mouseIndicators[property].position.z);

			game.objects.mouseIndicators[property] = mouseIndicator;

			game.addToGameScene(game.objects.mouseIndicators[property]);
		}
	}
});

socket.on('mySocketId', function (socketId) {
	game.mySocketId = socketId;
	game.init();
});

socket.on('reset', function () {
	location.reload();
});