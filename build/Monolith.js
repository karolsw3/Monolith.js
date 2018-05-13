'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var LiveObject = function () {
  function LiveObject(object) {
    var _this = this;

    classCallCheck(this, LiveObject);

    this.isMoving = false;
    this.isFalling = false;
    this.boundingBox = object.boundingBox;
    // Graphics
    this.mesh = object.mesh;
    this.mesh.mouseDown = function () {};
    this.mesh.mouseMove = function () {};
    // this.mesh.defaultColor = this.mesh.material.color
    this.position = this.mesh.position;
    this.stepDistance = object.stepDistance;
    this.position.set = function (x, y, z) {
      _this.position.x = x;
      _this.position.y = y;
      _this.position.z = z;
    };
  }

  createClass(LiveObject, [{
    key: 'move',
    value: function move(direction, callback) {
      var _this2 = this;

      this.isMoving = true;
      this.previousPosition = { x: this.position.x, y: this.position.y, z: this.position.z };
      for (var i = 0; i < 60; i++) {
        setTimeout(function () {
          switch (direction) {
            case 'right':
              _this2.position.x += _this2.stepDistance / 3 * 0.05;
              break;
            case 'left':
              _this2.position.x -= _this2.stepDistance / 3 * 0.05;
              break;
            case 'forward':
              _this2.position.z -= _this2.stepDistance / 3 * 0.05;
              break;
            case 'backward':
              _this2.position.z += _this2.stepDistance / 3 * 0.05;
              break;
          }
        }, 1 * i);
      }
      setTimeout(function () {
        _this2.isMoving = false;
        callback();
      }, 70);
    }
  }, {
    key: 'height',
    get: function get$$1() {
      return this.boundingBox.max.y;
    }
  }, {
    key: 'width',
    get: function get$$1() {
      return this.boundingBox.max.x;
    }
  }]);
  return LiveObject;
}();

var Utils = function () {
  function Utils() {
    classCallCheck(this, Utils);
  }

  createClass(Utils, [{
    key: "getObjectsFixedPosition",
    value: function getObjectsFixedPosition(objectPosition, grid) {
      var objectX = -Math.round(objectPosition.x / grid.width);
      var objectY = Math.ceil(objectPosition.y / grid.height);
      var objectZ = -Math.round(objectPosition.z / grid.depth);
      return {
        x: Math.abs(objectX),
        y: objectY,
        z: Math.abs(objectZ)
      };
    }
  }]);
  return Utils;
}();

var RetardedPhysicsEngine = function () {
  function RetardedPhysicsEngine(settings) {
    classCallCheck(this, RetardedPhysicsEngine);

    this.utils = new Utils();
    this.grid = settings.grid;
    this.sizeX = settings.sizeX;
    this.sizeY = settings.sizeY;
    this.sizeZ = settings.sizeZ;
    this.objectsAreAlreadyFalling = false;
    this.objectsMatrix = this._create3DMatrix(this.sizeX, this.sizeY, this.sizeZ);
    this.objectsWhichShouldFall = [];
  }

  createClass(RetardedPhysicsEngine, [{
    key: 'addObject',
    value: function addObject(object) {
      var position = this.utils.getObjectsFixedPosition(object.position, this.grid);
      this.objectsMatrix[position.x][position.y][position.z] = object;
    }
  }, {
    key: 'checkCollision',
    value: function checkCollision(object, direction) {
      var position = this.utils.getObjectsFixedPosition(object.position, this.grid);
      switch (direction) {
        case 'top':
          return this.objectsMatrix[position.x][position.y + 1][position.z] !== 0;
        case 'bottom':
          return this.objectsMatrix[position.x][position.y - 1][position.z] !== 0;
        case 'left':
          return this.objectsMatrix[position.x + 1][position.y][position.z] !== 0;
        case 'right':
          return this.objectsMatrix[position.x - 1][position.y][position.z] !== 0;
        case 'forward':
          return this.objectsMatrix[position.x][position.y][position.z + 1] !== 0;
        case 'backward':
          return this.objectsMatrix[position.x][position.y][position.z - 1] !== 0;
      }
    }
  }, {
    key: 'checkAllObjectsIfTheyShouldFall',
    value: function checkAllObjectsIfTheyShouldFall() {
      this.objectsWhichShouldFall = [];
      for (var x = 0; x < this.sizeX; x++) {
        for (var z = 0; z < this.sizeZ; z++) {
          this.checkIfColumnShouldFall(x, z);
        }
      }
    }
  }, {
    key: 'checkIfColumnShouldFall',
    value: function checkIfColumnShouldFall(x, z) {
      var groundPosition = 0;
      var isTheColumnFloating = false;
      for (var y = 0; y < this.sizeY; y++) {
        var object = this.objectsMatrix[x][y][z];
        if (y > 0 && object !== 0 && (this.objectsMatrix[x][y - 1][z] === 0 || isTheColumnFloating) && !object.isFalling) {
          object.distanceAboveGround = y - groundPosition;
          object.groundPosition = groundPosition;
          object.previousPosition = { x: x, y: y, z: z };
          this.objectsWhichShouldFall.push(object);
          isTheColumnFloating = true;
        }
        if (object !== 0) {
          groundPosition++;
        }
      }
    }
  }, {
    key: 'makeObjectsFall',
    value: function makeObjectsFall() {
      var _this = this;

      this.objectsAreAlreadyFalling = true;

      var _loop = function _loop(i) {
        var object = _this.objectsWhichShouldFall[i];

        object.previousPosition = Object.assign({}, object.position);
        object.isFalling = true;

        var _loop2 = function _loop2(repetitions) {
          setTimeout(function () {
            object.position.y = object.groundPosition * _this.grid.height + object.distanceAboveGround - _this._easeOutCubic(repetitions / 100) * object.distanceAboveGround;
          }, repetitions * object.distanceAboveGround);
        };

        for (var repetitions = 0; repetitions < 100; repetitions++) {
          _loop2(repetitions);
        }

        setTimeout(function () {
          object.position.y = Math.round(object.position.y);
          var actualPosition = _this.utils.getObjectsFixedPosition(object.position, _this.grid);
          var previousPosition = _this.utils.getObjectsFixedPosition(object.previousPosition, _this.grid);
          _this.objectsMatrix[actualPosition.x][actualPosition.y][actualPosition.z] = object;
          _this.objectsMatrix[previousPosition.x][previousPosition.y][previousPosition.z] = 0;
        }, 100 * object.distanceAboveGround);

        setTimeout(function () {
          object.isFalling = false;
        }, 110 * object.distanceAboveGround);
      };

      for (var i = 0; i < this.objectsWhichShouldFall.length; i++) {
        _loop(i);
      }

      this.objectsWhichShouldFall = [];
    }
  }, {
    key: '_easeOutCubic',
    value: function _easeOutCubic(t) {
      return Math.pow(t, 2);
    }
  }, {
    key: '_create3DMatrix',
    value: function _create3DMatrix(maxX, maxY, maxZ) {
      var matrix = [];
      for (var x = 0; x < maxX; x++) {
        matrix[x] = [];
        for (var y = 0; y < maxY; y++) {
          matrix[x][y] = [];
          for (var z = 0; z < maxZ; z++) {
            matrix[x][y][z] = 0;
          }
        }
      }
      return matrix;
    }
  }]);
  return RetardedPhysicsEngine;
}();

var Monolith = function () {
  function Monolith(settings) {
    classCallCheck(this, Monolith);

    this.utils = new Utils();
    this.settings = settings;
    this.loadedMeshes = [];
    this.onMeshesLoad = function () {};
    this.intersectableObjects = [];
    this.referenceObject = {};
    this.gravity = settings.gravity;
    this.grid = settings.grid;
    // Three.js
    this.scene = new THREE.Scene();
    this.loader = new THREE.ObjectLoader();
    this.aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.raycaster = new THREE.Raycaster();
    this.intersectedObject = {};

    // RetardedPhysicsEngine.js
    this.retardedPhysicsEngine = new RetardedPhysicsEngine({
      grid: this.settings.grid,
      sizeX: this.settings.sizeX,
      sizeY: this.settings.sizeY,
      sizeZ: this.settings.sizeZ
    });

    this._animate = this._animate.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
  }

  createClass(Monolith, [{
    key: 'init',
    value: function init() {
      var _this = this;

      this.scene.background = new THREE.Color(this.settings.backgroundColor);
      this.camera.position.set(this.grid.width, this.grid.width, this.grid.width);
      this.camera.lookAt(this.scene.position);
      this.camera.position.y = 100;
      this.camera.position.x = 100;
      this.camera.position.z = 100;
      this._addLights();
      this._addGrid();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      document.body.appendChild(this.renderer.domElement);

      window.addEventListener('mousedown', function (e) {
        return _this.mouseDown(e);
      });
      window.addEventListener('mousemove', function (e) {
        return _this.mouseMove(e);
      });
      window.addEventListener('resize', this._onWindowResize, false);

      requestAnimationFrame(this._animate);
    }
  }, {
    key: 'letAllFloatingObjectsFall',
    value: function letAllFloatingObjectsFall() {
      this.retardedPhysicsEngine.checkAllObjectsIfTheyShouldFall();
      this.retardedPhysicsEngine.makeObjectsFall();
    }
  }, {
    key: 'moveObject',
    value: function moveObject(object, direction) {
      var _this2 = this;

      var positionBefore = this.utils.getObjectsFixedPosition(object.position, this.grid);
      if (!this.retardedPhysicsEngine.checkCollision(object, direction) && !object.isMoving && !object.isFalling) {
        object.move(direction, function () {
          var positionAfter = _this2.utils.getObjectsFixedPosition(object.position, _this2.grid);
          _this2.retardedPhysicsEngine.objectsMatrix[positionAfter.x][positionAfter.y][positionAfter.z] = object;
          _this2.retardedPhysicsEngine.objectsMatrix[positionBefore.x][positionBefore.y][positionBefore.z] = 0;

          if (positionAfter.y > 0 && _this2.retardedPhysicsEngine.objectsMatrix[positionAfter.x][positionAfter.y - 1][positionAfter.z] === 0) {
            _this2.letAllFloatingObjectsFall();
          }

          if (object.cameraAttached) {
            _this2.smoothlySetCameraPosition(positionAfter);
          }
        });
      }
    }
  }, {
    key: 'createBlock',
    value: function createBlock(color) {
      var geometry = new THREE.CubeGeometry(this.grid.width, this.grid.height, this.grid.depth);
      var material = new THREE.MeshLambertMaterial({ color: color });
      var mesh = new THREE.Mesh(geometry, material);
      var object = {};
      object.mesh = mesh;
      object.stepDistance = this.grid.width;
      var block = new LiveObject(object);
      return block;
    }
  }, {
    key: 'createObjectFromMesh',
    value: function createObjectFromMesh(mesh) {
      var boundingBox = new THREE.Box3().setFromObject(mesh);
      var object = new LiveObject({
        mesh: mesh.clone(),
        stepDistance: this.grid.width,
        boundingBox: boundingBox
      });
      return object;
    }
  }, {
    key: '_getObjectJSON',
    value: function _getObjectJSON(url, onload) {
      this.loader.load(url, function (object) {
        onload(object);
      }, function () {}, function (err) {
        console.error(err);
      });
    }
  }, {
    key: 'loadMeshes',
    value: function loadMeshes(meshes) {
      var _this3 = this;

      var meshesLoadedCount = 0;

      var _loop = function _loop(i) {
        _this3._getObjectJSON(meshes[i].url, function (mesh) {
          _this3.loadedMeshes[meshes[i].name] = mesh;
          meshesLoadedCount++;
          if (meshesLoadedCount === meshes.length) {
            _this3.onMeshesLoad();
          }
        });
      };

      for (var i = 0; i < meshes.length; i++) {
        _loop(i);
      }
    }
  }, {
    key: 'placeObject',
    value: function placeObject(object, x, y, z) {
      var w = this.grid.width;
      var h = this.grid.height;

      object.position.set(-x * w, y * h, -z * w);

      this.intersectableObjects.push(object.mesh);
      this.scene.add(object.mesh);

      // RetardedPhysicsEngine.js
      this.retardedPhysicsEngine.addObject(object);
    }
  }, {
    key: '_onWindowResize',
    value: function _onWindowResize() {
      this.camera.left = -20 * window.innerWidth / window.innerHeight;
      this.camera.right = 20 * window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }, {
    key: '_addLights',
    value: function _addLights() {
      this.scene.add(new THREE.AmbientLight(0xbbbbbb));
      var spotLightTop = new THREE.SpotLight(0x444444);
      var spotLightLeft = new THREE.SpotLight(0x222222);
      spotLightTop.position.set(0, 1000, 0);
      spotLightLeft.position.set(0, 0, 1000);

      this.scene.add(spotLightTop);
      this.scene.add(spotLightLeft);
    }

    // Let the camera follow specified object!

  }, {
    key: 'attachCamera',
    value: function attachCamera(object) {
      object.cameraAttached = true;
      this.referenceObject = object;
    }
  }, {
    key: '_addGrid',
    value: function _addGrid() {
      var k = 10;
      var size = this.settings.sizeX * this.grid.width * k;
      var divisions = this.settings.sizeX * k;
      var gridHelper = new THREE.GridHelper(size, divisions);
      gridHelper.position.set(this.grid.width / 2, -this.grid.height / 2, this.grid.depth / 2);
      this.scene.add(gridHelper);
    }
  }, {
    key: 'mouseMove',
    value: function mouseMove(event) {
      event.preventDefault();
      var mouse3D = new THREE.Vector3(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      this.raycaster.setFromCamera(mouse3D, this.camera);
      var intersects = this.raycaster.intersectObjects(this.intersectableObjects);
      if (intersects.length > 0) {
        intersects[0].object.mouseMove();
      }
    }
  }, {
    key: 'mouseDown',
    value: function mouseDown(event) {
      event.preventDefault();
      var mouse3D = new THREE.Vector3(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      this.raycaster.setFromCamera(mouse3D, this.camera);
      var intersects = this.raycaster.intersectObjects(this.intersectableObjects);
      if (intersects.length > 0) {
        intersects[0].object.mouseDown();
      }
    }
  }, {
    key: '_checkIfObjectIsWithinRenderDistance',
    value: function _checkIfObjectIsWithinRenderDistance(object) {
      var position = this.utils.getObjectsFixedPosition(object.position, this.settings.grid);
      var referencePosition = this.utils.getObjectsFixedPosition(this.referenceObject.position, this.settings.grid);
      return position.x > referencePosition.x - this.settings.renderDistance * this.grid.width && position.x < referencePosition.x + this.settings.renderDistance * this.grid.width && position.z > referencePosition.z - this.settings.renderDistance * this.grid.width && position.z < referencePosition.z + this.settings.renderDistance * this.grid.width;
    }
  }, {
    key: 'smoothlySetCameraPosition',
    value: function smoothlySetCameraPosition(position) {
      var _this4 = this;

      var translationX = -position.x * this.grid.width - this.camera.position.x;
      var translationZ = -position.z * this.grid.depth - this.camera.position.z;
      var frames = 100;
      for (var i = 0; i < frames; i++) {
        setTimeout(function () {
          _this4.camera.position.x += translationX / frames + 1;
          _this4.camera.position.z += translationZ / frames + 1;
        }, i * 1);
      }
    }
  }, {
    key: '_animate',
    value: function _animate(time) {
      this._render();
      requestAnimationFrame(this._animate);
    }
  }, {
    key: '_render',
    value: function _render() {
      this.renderer.render(this.scene, this.camera);
    }
  }]);
  return Monolith;
}();
