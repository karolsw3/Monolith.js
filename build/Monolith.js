'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

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
    this.horizontalCollision = false;

    // Graphics
    this.mesh = new THREE.Mesh(object.geometry, object.material);
    this.mesh.mouseDown = function () {};
    this.mesh.defaultColor = this.mesh.material.color;
    this.position = this.mesh.position;
    this.width = this.mesh.geometry.parameters.width;
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
              _this2.position.x += _this2.width / 3 * 0.05;
              break;
            case 'left':
              _this2.position.x -= _this2.width / 3 * 0.05;
              break;
            case 'forward':
              _this2.position.z -= _this2.width / 3 * 0.05;
              break;
            case 'backward':
              _this2.position.z += _this2.width / 3 * 0.05;
              break;
          }
        }, 1 * i);
      }
      setTimeout(function () {
        _this2.isMoving = false;
        callback();
      }, 70);
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
      var columnHeight = 0;
      for (var y = 0; y < this.sizeY; y++) {
        var object = this.objectsMatrix[x][y][z];
        if (y > 0 && object !== 0 && (this.objectsMatrix[x][y - 1 - columnHeight][z] === 0 || this.objectsMatrix[x][y - 1][z] === 0)) {
          object.distanceAboveGround = y - groundPosition;
          object.groundPosition = groundPosition;
          object.previousPosition = { x: x, y: y, z: z };
          this.objectsWhichShouldFall.push(object);
          columnHeight++;
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

      if (!this.objectsAreAlreadyFalling) {
        this.objectsAreAlreadyFalling = true;

        var _loop = function _loop(i) {
          var object = _this.objectsWhichShouldFall[i];

          object.previousPosition = Object.assign({}, object.position);
          object.isFalling = true;

          var _loop2 = function _loop2(repetitions) {
            setTimeout(function () {
              object.position.y = object.groundPosition + object.distanceAboveGround - _this._easeOutCubic(repetitions / 100) * object.distanceAboveGround;
            }, repetitions * 8);
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
          }, 100 * 8);

          setTimeout(function () {
            object.isFalling = false;
          }, 1000);
        };

        for (var i = 0; i < this.objectsWhichShouldFall.length; i++) {
          _loop(i);
        }

        setTimeout(function () {
          _this.objectsAreAlreadyFalling = false;
        }, 100 * 8 + 100);

        this.objectsWhichShouldFall = [];
      }
    }
  }, {
    key: '_easeOutCubic',
    value: function _easeOutCubic(t) {
      return Math.pow(t, 3);
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
    this.loadedObjects = [];
    this.intersectableObjects = [];
    this.referenceObject = {};
    this.gravity = settings.gravity;
    this.meshes = [];
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
      sizeX: 10,
      sizeY: 100,
      sizeZ: 10
    });

    this._animate = this._animate.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
  }

  createClass(Monolith, [{
    key: 'init',
    value: function init() {
      var _this = this;

      this.scene.background = new THREE.Color(this.settings.backgroundColor);
      this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth);
      this.camera.lookAt(this.scene.position);
      this.camera.position.y = 20;
      this._addLights();
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
          _this2.letAllFloatingObjectsFall();
        });
      }
    }
  }, {
    key: 'createBlock',
    value: function createBlock(color) {
      var geometry = new THREE.CubeGeometry(this.settings.blockWidth, this.settings.blockHeight, this.settings.blockWidth);
      var material = new THREE.MeshLambertMaterial({ color: color });
      var object = {};
      object.geometry = geometry;
      object.material = material;
      var block = new LiveObject(object);
      return block;
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
    key: 'loadObjects',
    value: function loadObjects(objects) {
      var _this3 = this;

      var _loop = function _loop(i) {
        _this3._getObjectJSON(objects[i].url, function (object) {
          var liveObject = new LiveObject(object);
          _this3.loadedObjects[objects[i].name] = liveObject;
        });
      };

      for (var i = 0; i < objects.length; i++) {
        _loop(i);
      }
    }
  }, {
    key: 'loadObject',
    value: function loadObject(url, x, y, z) {
      var _this4 = this;

      this._getObjectJSON(url, function (object) {
        _this4.scene.add(object);
        _this4.meshes.push(object);
      });
    }
  }, {
    key: 'placeObject',
    value: function placeObject(object, x, y, z) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;

      object.position.set(-x * w, y * h, -z * w);
      this.meshes.push(object.mesh);

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
    key: 'mouseMove',
    value: function mouseMove(event) {
      event.preventDefault();
      var mouse3D = new THREE.Vector3(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      this.raycaster.setFromCamera(mouse3D, this.camera);
      var intersects = this.raycaster.intersectObjects(this.intersectableObjects);
      if (_typeof(intersects[0]) === 'object') {
        if (this.intersectedObject.id !== intersects[0].object.id) {
          try {
            this.intersectedObject.material.color = { r: this.intersectedObject.defaultColor.r, g: this.intersectedObject.defaultColor.g, b: this.intersectedObject.defaultColor.b };
          } catch (e) {}
          this.intersectedObject = intersects[0].object;
        } else {
          intersects[0].object.material.color = { r: 255, g: 255, b: 255 };
        }
      }
    }
  }, {
    key: 'mouseDown',
    value: function mouseDown(event) {
      event.preventDefault();
      var mouse3D = new THREE.Vector3(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      this.raycaster.setFromCamera(mouse3D, this.camera);
      var intersects = this.raycaster.intersectObjects(this.intersectableObjects);
      intersects.forEach(function (object) {
        object.object.mouseDown();
      });
    }
  }, {
    key: '_checkIfObjectIsWithinRenderDistance',
    value: function _checkIfObjectIsWithinRenderDistance(object) {
      var position = this.utils.getObjectsFixedPosition(object.position, this.settings.grid);
      var referencePosition = this.utils.getObjectsFixedPosition(this.referenceObject.position, this.settings.grid);
      return position.x > referencePosition.x - this.settings.renderDistance * this.settings.blockWidth && position.x < referencePosition.x + this.settings.renderDistance * this.settings.blockWidth && position.z > referencePosition.z - this.settings.renderDistance * this.settings.blockWidth && position.z < referencePosition.z + this.settings.renderDistance * this.settings.blockWidth;
    }
  }, {
    key: 'smoothlySetCameraPosition',
    value: function smoothlySetCameraPosition(x, y, z) {
      var _this5 = this;

      var translationX = x - this.camera.position.x;
      var translationY = y - this.camera.position.y;
      var translationZ = z - this.camera.position.z;
      var frames = 100;
      for (var i = 0; i < frames; i++) {
        setTimeout(function () {
          _this5.camera.position.x += translationX / frames;
          _this5.camera.position.y += translationY / frames;
          _this5.camera.position.z += translationZ / frames;
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
