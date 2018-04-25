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

var Monolith = function () {
  function Monolith(settings) {
    classCallCheck(this, Monolith);

    this.settings = settings;
    this.intersectableObjects = [];
    this.objects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ);
    this.objectsWhichShouldFall = [];
    this.referenceObject = {};
    // Three.js
    this.scene = new THREE.Scene();
    this.aspect = window.innerWidth / window.innerHeight;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.raycaster = new THREE.Raycaster();

    this._animate = this._animate.bind(this);
  }

  createClass(Monolith, [{
    key: 'init',
    value: function init() {
      var _this = this;

      this.scene.background = new THREE.Color('rgb(53,12,63)');
      this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth);
      this.camera.lookAt(this.scene.position);
      this.camera.position.y = this.settings.sizeY;
      this._addLights();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      document.body.appendChild(this.renderer.domElement);

      window.addEventListener('mousedown', function (e) {
        return _this.mouseDown(e);
      });
      requestAnimationFrame(this._animate);
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
  }, {
    key: 'createBlock',
    value: function createBlock(color) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;
      var block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: color }));
      block.velocity = 0;
      block.inMotion = false;
      return block;
    }
  }, {
    key: 'placeObject',
    value: function placeObject(object, x, y, z) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;
      object.position.x = -x * w;
      object.position.y = y * h;
      object.position.z = -z * w;
      this.objects[x][y][z] = object;
      if (typeof object.mouseDown === 'undefined') {
        object.mouseDown = function () {};
      }
      if (!(y === 0 || this.objects[x][y - 1][z] !== 0)) {
        this.objectsWhichShouldFall.push(object);
      }
      this.intersectableObjects.push(object);
      this.scene.add(object);
    }

    // Let the camera follow specified object!

  }, {
    key: 'attachCamera',
    value: function attachCamera(object) {
      object.cameraAttached = true;
      this.referenceObject = object;
    }
  }, {
    key: 'attachMovementControls',
    value: function attachMovementControls(object) {
      var _this2 = this;

      object.move = function (direction) {
        var positionBefore = _this2._getObjectsFixedPosition(object);
        var blockMoved = false;
        if (!object.inMotion && object.velocity === 0) {
          switch (direction) {
            case 'right':
              if (!_this2._checkCollision(object, 'right') && !object.inMotion) {
                for (var i = 0; i < 40; i++) {
                  setTimeout(function () {
                    object.position.x += 0.025 * object.geometry.parameters.width;
                  }, i * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'backward':
              if (!_this2._checkCollision(object, 'back') && !object.inMotion) {
                for (var _i = 0; _i < 40; _i++) {
                  setTimeout(function () {
                    object.position.z += 0.025 * object.geometry.parameters.depth;
                  }, _i * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'left':
              if (!_this2._checkCollision(object, 'left') && !object.inMotion) {
                for (var _i2 = 0; _i2 < 40; _i2++) {
                  setTimeout(function () {
                    object.position.x -= 0.025 * object.geometry.parameters.width;
                  }, _i2 * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'forward':
              if (!_this2._checkCollision(object, 'front') && !object.inMotion) {
                for (var _i3 = 0; _i3 < 40; _i3++) {
                  setTimeout(function () {
                    object.position.z -= 0.025 * object.geometry.parameters.depth;
                  }, _i3 * 1);
                  blockMoved = true;
                }
              }
          }
          object.inMotion = true;
          setTimeout(function () {
            object.inMotion = false;
            var positionAfter = _this2._getObjectsFixedPosition(object);
            if (blockMoved) {
              _this2.objects[positionAfter.x][positionAfter.y][positionAfter.z] = Object.assign({}, _this2.objects[positionBefore.x][positionBefore.y][positionBefore.z]);
              _this2.objects[positionBefore.x][positionBefore.y][positionBefore.z] = 0;
              _this2._checkIfObjectShouldFall(object);

              if (object.cameraAttached) {
                _this2.smoothlySetCameraPosition(object.position.x + 100, object.position.y + 100, object.position.z + 100);
              }
            }
          }, 40 * 2);
        }
        object.position.x = Math.round(object.position.x);
        object.position.z = Math.round(object.position.z);
      };
    }
  }, {
    key: '_animate',
    value: function _animate() {
      this._render();
      this._makeObjectsFall(this.settings.gravity);
      requestAnimationFrame(this._animate);
    }

    /**
     * Check collision with specified object and its neighbour at specified direction
     */

  }, {
    key: '_checkCollision',
    value: function _checkCollision(object, direction) {
      var position = this._getObjectsFixedPosition(object);
      var neighbour = void 0;
      switch (direction) {
        case 'bottom':
          neighbour = this.objects[position.x][position.y - 1][position.z];
          return neighbour !== 0 && !neighbour.isFalling;
        case 'top':
          neighbour = this.objects[position.x][position.y + 1][position.z];
          return neighbour !== 0 && !neighbour.isFalling;
        case 'left':
          neighbour = this.objects[position.x + 1][position.y][position.z];
          return neighbour !== 0 && !neighbour.isFalling;
        case 'right':
          neighbour = this.objects[position.x - 1][position.y][position.z];
          return neighbour !== 0 && !neighbour.isFalling;
        case 'front':
          neighbour = this.objects[position.x][position.y][position.z + 1];
          return neighbour !== 0 && !neighbour.isFalling;
        case 'back':
          neighbour = this.objects[position.x][position.y][position.z - 1];
          return neighbour !== 0 && !neighbour.isFalling;
      }
    }
  }, {
    key: 'mouseDown',
    value: function mouseDown(event) {
      console.log('dfasdfds');
      event.preventDefault();
      var mouse3D = new THREE.Vector3(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
      this.raycaster.setFromCamera(mouse3D, this.camera);
      var intersects = this.raycaster.intersectObjects(this.intersectableObjects);
      intersects.forEach(function (object) {
        object.object.mouseDown();
      });
    }
  }, {
    key: '_checkIfObjectShouldFall',
    value: function _checkIfObjectShouldFall(object) {
      if (object !== 0) {
        if (!this._checkCollision(object, 'bottom')) {
          this.objectsWhichShouldFall.push(object);
          return true;
        }
      }
      return false;
    }

    /**
     * If objects are not vertically colliding with other objects - make them fall
     * The objects will not fall beneath the ground position (y === 0)
     */

  }, {
    key: '_makeObjectsFall',
    value: function _makeObjectsFall(acceleration) {
      var _this3 = this;

      this.objectsWhichShouldFall.forEach(function (object, index) {
        var positionBefore = _this3._getObjectsFixedPosition(object);
        if (object !== 0 && _this3._checkIfObjectIsWithinRenderDistance(object)) {
          if (!_this3._checkCollision(object, 'bottom')) {
            object.velocity += acceleration;
            object.position.y -= object.velocity;
          } else {
            object.position.y = Math.ceil(object.position.y);
            object.velocity = 0;
            _this3.objectsWhichShouldFall.splice(index, 1);
          }
          var positionAfter = _this3._getObjectsFixedPosition(object);
          _this3.objects[positionBefore.x][Math.round(positionBefore.y)][positionBefore.z] = 0;
          _this3.objects[positionAfter.x][Math.round(positionAfter.y)][positionAfter.z] = Object.assign({}, object);
        }
      });
    }
  }, {
    key: '_checkIfObjectIsWithinRenderDistance',
    value: function _checkIfObjectIsWithinRenderDistance(object) {
      var position = this._getObjectsFixedPosition(object);
      var referencePosition = this._getObjectsFixedPosition(this.referenceObject);
      return position.x > referencePosition.x - this.settings.renderDistance * this.settings.blockWidth && position.x < referencePosition.x + this.settings.renderDistance * this.settings.blockWidth && position.z > referencePosition.z - this.settings.renderDistance * this.settings.blockWidth && position.z < referencePosition.z + this.settings.renderDistance * this.settings.blockWidth;
    }
  }, {
    key: '_getObjectsFixedPosition',
    value: function _getObjectsFixedPosition(object) {
      var objectX = -Math.round(object.position.x / object.geometry.parameters.width);
      var objectY = Math.ceil(object.position.y / object.geometry.parameters.height);
      var objectZ = -Math.round(object.position.z / object.geometry.parameters.depth);
      return {
        x: objectX,
        y: objectY,
        z: objectZ
      };
    }
  }, {
    key: 'smoothlySetCameraPosition',
    value: function smoothlySetCameraPosition(x, y, z) {
      var _this4 = this;

      var translationX = x - this.camera.position.x;
      var translationY = y - this.camera.position.y;
      var translationZ = z - this.camera.position.z;
      var frames = 100;
      for (var i = 0; i < frames; i++) {
        setTimeout(function () {
          _this4.camera.position.x += translationX / frames;
          _this4.camera.position.y += translationY / frames;
          _this4.camera.position.z += translationZ / frames;
        }, i * 1);
      }
    }
  }, {
    key: '_render',
    value: function _render() {
      this.renderer.render(this.scene, this.camera);
    }
  }, {
    key: '_create3DArray',
    value: function _create3DArray(sizeX, sizeY, sizeZ) {
      var array = [];
      for (var x = 0; x < sizeX; x++) {
        array[x] = [];
        for (var y = 0; y < sizeY; y++) {
          array[x][y] = [];
          for (var z = 0; z < sizeZ; z++) {
            array[x][y][z] = 0;
          }
        }
      }
      return array;
    }
  }]);
  return Monolith;
}();
