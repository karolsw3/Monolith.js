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
    this.objects = [];
    this.objects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ);

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
      this.scene.background = new THREE.Color('rgb(53,12,63)');
      this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth);
      this.camera.lookAt(this.scene.position);
      this._addLights();
      this._addGrid();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      document.body.appendChild(this.renderer.domElement);

      requestAnimationFrame(this._animate);
    }
  }, {
    key: '_addGrid',
    value: function _addGrid() {
      var w = this.settings.blockWidth;
      var e = 100;
      var geometry = new THREE.PlaneBufferGeometry(w * e, w * e, w * e, w * e);
      var material = new THREE.MeshBasicMaterial({ wireframe: true, opacity: 0.05, transparent: true });
      var grid = new THREE.Mesh(geometry, material);
      grid.rotation.order = 'YXZ';
      grid.rotation.y = -Math.PI / 2;
      grid.rotation.x = -Math.PI / 2;
      this.scene.add(grid);
    }
  }, {
    key: '_addLights',
    value: function _addLights() {
      this.scene.add(new THREE.AmbientLight(0x444444));
      var spotLightTop = new THREE.SpotLight(0xaaaaaa);
      var spotLightLeft = new THREE.SpotLight(0x444444);
      spotLightTop.position.set(0, 120, 0);
      spotLightTop.castShadow = true;
      spotLightLeft.position.set(0, 0, 120);
      spotLightLeft.castShadow = true;

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
      object.isFalling = !(y === 0 || this.objects[x][y - 1][z] !== 0);
      this.scene.add(object);
    }
  }, {
    key: 'generateFloor',
    value: function generateFloor(y, length, width) {
      for (var x = 0; x < length; x++) {
        for (var z = 0; z < width; z++) {
          if (x % 2 === 0 && z % 2 === 0 || x % 2 === 1 && z % 2 === 1) {
            this.placeObject(this.createBlock(0x44ff55), x, y, z);
          } else {
            this.placeObject(this.createBlock(0x33ee44), x, y, z);
          }
        }
      }
      this.camera.position.y = this.settings.blockWidth * (length / 2);
    }

    // Let the camera follow the object!

  }, {
    key: 'attachCamera',
    value: function attachCamera(object) {
      object.cameraAttached = true;
    }
  }, {
    key: 'attachMovementControls',
    value: function attachMovementControls(object) {
      var _this = this;

      object.move = function (direction) {
        var positionBefore = _this._getObjectsFixedPosition(object);
        var blockMoved = false;
        if (!object.inMotion) {
          switch (direction) {
            case 'right':
              if (!_this._checkCollision(object, 'right') && !object.inMotion) {
                for (var i = 0; i < 40; i++) {
                  setTimeout(function () {
                    object.position.x += 0.025 * object.geometry.parameters.width;
                  }, i * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'backward':
              if (!_this._checkCollision(object, 'back') && !object.inMotion) {
                for (var _i = 0; _i < 40; _i++) {
                  setTimeout(function () {
                    object.position.z += 0.025 * object.geometry.parameters.depth;
                  }, _i * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'left':
              if (!_this._checkCollision(object, 'left') && !object.inMotion) {
                for (var _i2 = 0; _i2 < 40; _i2++) {
                  setTimeout(function () {
                    object.position.x -= 0.025 * object.geometry.parameters.width;
                  }, _i2 * 1);
                  blockMoved = true;
                }
              }
              break;
            case 'forward':
              if (!_this._checkCollision(object, 'front') && !object.inMotion) {
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
            var positionAfter = _this._getObjectsFixedPosition(object);
            if (blockMoved) {
              _this.objects[positionAfter.x][positionAfter.y][positionAfter.z] = Object.assign({}, _this.objects[positionBefore.x][positionBefore.y][positionBefore.z]);
              _this.objects[positionBefore.x][positionBefore.y][positionBefore.z] = 0;

              if (object.cameraAttached) {
                _this.camera.position.set(object.position.x + 100, object.position.y + 100, object.position.z + 100);
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

    /**
     * If objects are not vertically colliding with other objects - make them fall
     * The objects will not fall beneath the ground position (y === 0)
     */

  }, {
    key: '_makeObjectsFall',
    value: function _makeObjectsFall(acceleration) {
      // TODO
      for (var x = 0; x < this.settings.sizeX; x++) {
        for (var y = 1; y < this.settings.sizeY; y++) {
          for (var z = 0; z < this.settings.sizeZ; z++) {
            var object = this.objects[x][y][z];
            if (object !== 0) {
              if (!this._checkCollision(object, 'bottom')) {
                object.isFalling = true;
                object.velocity += acceleration;
                object.position.y -= object.velocity;
              } else {
                object.position.y = Math.ceil(object.position.y);
                object.velocity = 0;
                // If object is still falling, but the collision has occured - stop it and update its position on objects matrix
                if (object.isFalling) {
                  object.isFalling = false;
                  var position = this._getObjectsFixedPosition(object);
                  this.objects[position.x][position.y][position.z] = Object.assign({}, object);
                  this.objects[x][y][z] = 0;
                }
              }
            }
          }
        }
      }
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
