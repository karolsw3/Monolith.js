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
    this.stableObjects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ);

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
      this.scene.add(new THREE.AxesHelper(60));
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
      this.stableObjects[x][y][z] = object;
      this.scene.add(object);
    }
  }, {
    key: 'generateFloor',
    value: function generateFloor(length, width) {
      for (var x = 0; x < length; x++) {
        for (var z = 0; z < width; z++) {
          if (x % 2 === 0 && z % 2 === 0 || x % 2 === 1 && z % 2 === 1) {
            this.placeObject(this.createBlock(0x44ff55), x, 0, z);
          } else {
            this.placeObject(this.createBlock(0x33ee44), x, 0, z);
          }
        }
      }
      this.camera.position.y = this.settings.blockWidth * (length / 2);
    }
  }, {
    key: 'attachMovementControls',
    value: function attachMovementControls(object) {
      var _this = this;

      object.move = function (direction) {
        if (!object.inMotion) {
          switch (direction) {
            case 'right':
              if (!_this._checkCollision(object, 'right') && !object.inMotion) {
                for (var i = 0; i < 40; i++) {
                  setTimeout(function () {
                    object.position.x += 0.025 * object.geometry.parameters.width;
                  }, i * 1);
                }
              }
              break;
            case 'backward':
              if (!_this._checkCollision(object, 'front') && !object.inMotion) {
                for (var _i = 0; _i < 40; _i++) {
                  setTimeout(function () {
                    object.position.z += 0.025 * object.geometry.parameters.depth;
                  }, _i * 1);
                }
              }
              break;
            case 'left':
              if (!_this._checkCollision(object, 'left') && !object.inMotion) {
                for (var _i2 = 0; _i2 < 40; _i2++) {
                  setTimeout(function () {
                    object.position.x -= 0.025 * object.geometry.parameters.width;
                  }, _i2 * 1);
                }
              }
              break;
            case 'forward':
              if (!_this._checkCollision(object, 'back') && !object.inMotion) {
                for (var _i3 = 0; _i3 < 40; _i3++) {
                  setTimeout(function () {
                    object.position.z -= 0.025 * object.geometry.parameters.depth;
                  }, _i3 * 1);
                }
              }
          }
          object.inMotion = true;
          setTimeout(function () {
            object.inMotion = false;
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
  }, {
    key: '_checkCollision',
    value: function _checkCollision(object, direction) {
      var objectX = -Math.round(object.position.x / object.geometry.parameters.width);
      var objectY = Math.ceil(object.position.y / object.geometry.parameters.height);
      var objectZ = -Math.round(object.position.z / object.geometry.parameters.depth);
      switch (direction) {
        case 'bottom':
          return this.stableObjects[objectX][objectY - 1][objectZ] !== 0;
        case 'top':
          return this.stableObjects[objectX][objectY + 1][objectZ] !== 0;
        case 'left':
          return this.stableObjects[objectX + 1][objectY][objectZ] !== 0;
        case 'right':
          return this.stableObjects[objectX - 1][objectY][objectZ] !== 0;
        case 'front':
          return this.stableObjects[objectX][objectY][objectZ - 1] !== 0;
        case 'back':
          return this.stableObjects[objectX][objectY][objectZ + 1] !== 0;
      }
    }

    /**
     * If objects are not vertically colliding with other objects - make them fall
     * The objects will not fall beneath the ground position (y = 0)
     */

  }, {
    key: '_makeObjectsFall',
    value: function _makeObjectsFall(acceleration) {
      // TODO
      for (var x = 0; x < this.settings.sizeX; x++) {
        for (var y = 1; y < this.settings.sizeY; y++) {
          for (var z = 0; z < this.settings.sizeZ; z++) {
            if (this.stableObjects[x][y][z] !== 0) {
              if (!this._checkCollision(this.stableObjects[x][y][z], 'bottom')) {
                this.stableObjects[x][y][z].velocity += acceleration;
                this.stableObjects[x][y][z].position.y -= this.stableObjects[x][y][z].velocity;
              } else {
                this.stableObjects[x][y][z].position.y = Math.ceil(this.stableObjects[x][y][z].position.y);
                this.stableObjects[x][y][z].velocity = 0;
              }
            }
          }
        }
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
