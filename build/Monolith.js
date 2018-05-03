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

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var LiveObject = function () {
  function LiveObject(settings) {
    classCallCheck(this, LiveObject);

    this.width = settings.width;
    this.height = settings.height;
    this.horizontalCollision = false;

    // Graphics
    var object = new THREE.Mesh(settings.geometry, settings.material);
    object.mass = settings.mass;
    this.mesh = object;
    this.mesh.mouseDown = function () {};
    this.mesh.defaultColor = settings.color;
    // Physics
    this.body = new CANNON.Body({ mass: settings.mass, material: new CANNON.Material() });
    this.body.inMove = false;
    this.body.addShape(settings.shape);
  }

  createClass(LiveObject, [{
    key: 'attachMovementControls',
    value: function attachMovementControls() {
      var _this = this;

      this.body.angularDamping = 1;

      this.body.addEventListener('collide', function (e) {
        if (Math.round(e.body.position.y) === Math.ceil(_this.body.position.y)) {
          _this.horizontalCollision = true;
        }
      }, false);
    }
  }, {
    key: 'move',
    value: function move(direction) {
      var _this2 = this;

      if (!this.body.inMove) {
        this.body.inMove = true;
        this.body.position.y += this.height * 0.3;
        this.body.previousPosition = { x: this.body.position.x, y: this.body.position.y, z: this.body.position.z };
        for (var i = 0; i < 60; i++) {
          setTimeout(function () {
            if (!_this2.horizontalCollision) {
              switch (direction) {
                case 'right':
                  _this2.body.position.x += _this2.width / 3 * 0.048;
                  break;
                case 'left':
                  _this2.body.position.x -= _this2.width / 3 * 0.048;
                  break;
                case 'forward':
                  _this2.body.position.z -= _this2.width / 3 * 0.048;
                  break;
                case 'backward':
                  _this2.body.position.z += _this2.width / 3 * 0.048;
                  break;
              }
            } else {
              _this2.body.position.set(_this2.body.previousPosition.x, _this2.body.previousPosition.y, _this2.body.previousPosition.z);
            }
          }, 1 * i);

          setTimeout(function () {
            _this2.body.velocity.y = 0;
          }, 110);

          setTimeout(function () {
            if (_this2.horizontalCollision) {
              _this2.body.position.set(_this2.body.previousPosition.x, _this2.body.previousPosition.y, _this2.body.previousPosition.z);
            }
            _this2.body.position.x = Math.round(_this2.body.position.x);
            _this2.body.velocity.x = 0;
            _this2.body.velocity.z = 0;
            _this2.body.position.z = Math.round(_this2.body.position.z);
          }, 81);

          setTimeout(function () {
            _this2.body.inMove = false;
            _this2.horizontalCollision = false;
          }, 100);
        }
      }
    }
  }]);
  return LiveObject;
}();

var Player = function (_LiveObject) {
  inherits(Player, _LiveObject);

  function Player(settings) {
    classCallCheck(this, Player);
    return possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this));
  }

  return Player;
}(LiveObject);

var Monolith = function () {
  function Monolith(settings) {
    classCallCheck(this, Monolith);

    this.settings = settings;
    this.intersectableObjects = [];
    this.referenceObject = {};
    // Three.js
    this.scene = new THREE.Scene();
    this.loader = new THREE.ObjectLoader();
    this.aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.raycaster = new THREE.Raycaster();
    this.intersectedObject = {};

    // Cannon.js
    this.bodies = [];
    this.meshes = [];
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 3;

    this._animate = this._animate.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
    this._normalizeBodiesPositions = this._normalizeBodiesPositions.bind(this);
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

      // Cannon.js

      this.world = new CANNON.World();
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 12;
      this.world.gravity.set(0, -this.settings.gravity, 0);

      window.addEventListener('mousedown', function (e) {
        return _this.mouseDown(e);
      });
      window.addEventListener('mousemove', function (e) {
        return _this.mouseMove(e);
      });
      window.addEventListener('resize', this._onWindowResize, false);

      setInterval(this._normalizeBodiesPositions, 100);

      requestAnimationFrame(this._animate);
    }
  }, {
    key: 'createBlock',
    value: function createBlock(color, mass) {
      var geometry = new THREE.CubeGeometry(this.settings.blockWidth, this.settings.blockHeight, this.settings.blockWidth);
      var material = new THREE.MeshLambertMaterial({ color: color });
      var shape = new CANNON.Box(new CANNON.Vec3(-0.48 * this.settings.blockWidth, 0.5 * this.settings.blockHeight, -0.48 * this.settings.blockWidth));
      var block = new LiveObject({
        geometry: geometry,
        material: material,
        shape: shape,
        color: color,
        width: this.settings.blockWidth,
        height: this.settings.blockHeight,
        mass: mass
      });
      return block;
    }
  }, {
    key: '_loadObjectJSON',
    value: function _loadObjectJSON(url, onload) {
      this.loader.load(url, function (object) {
        onload(object);
      }, function () {}, function (err) {
        console.error(err);
      });
    }
  }, {
    key: 'loadObject',
    value: function loadObject(url, x, y, z) {
      var _this2 = this;

      this._loadObjectJSON(url, function (object) {
        _this2.scene.add(object);
        _this2.meshes.push(object);
        var shape = new CANNON.Box(new CANNON.Vec3(-0.48 * _this2.settings.blockWidth, 0.5 * _this2.settings.blockHeight, -0.48 * _this2.settings.blockWidth));
        var body = new CANNON.Body({ mass: 700, material: new CANNON.Material() });
        body.inMove = false;
        body.position.set(x, y, z);
        body.addShape(shape);
        _this2.bodies.push(body);
        _this2.world.addBody(body);
      });
    }
  }, {
    key: 'placeObject',
    value: function placeObject(object, x, y, z) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;

      object.body.position.set(-x * w, y * h, -z * w);
      this.world.addBody(object.body);
      this.meshes.push(object.mesh);
      this.bodies.push(object.body);

      this.intersectableObjects.push(object.mesh);
      this.scene.add(object.mesh);
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
  }, {
    key: '_normalizeBodiesPositions',
    value: function _normalizeBodiesPositions() {
      for (var i = 0; i < this.bodies.length; i++) {
        if (!this.bodies[i].inMove) {
          if (Math.round(this.bodies[i].position.x) !== this.bodies[i].position.x) {
            this.bodies[i].position.x = Math.round(this.bodies[i].position.x / this.settings.blockWidth) * this.settings.blockWidth;
          }
          if (Math.round(this.bodies[i].position.z) !== this.bodies[i].position.z) {
            this.bodies[i].position.z = Math.round(this.bodies[i].position.z / this.settings.blockWidth) * this.settings.blockWidth;
          }
        }
      }
    }

    // Let the camera follow specified object!

  }, {
    key: 'attachCamera',
    value: function attachCamera(object) {
      object.cameraAttached = true;
      this.referenceObject = object;
    }
  }, {
    key: '_updateMeshPositions',
    value: function _updateMeshPositions() {
      for (var i = 0; i < this.meshes.length; i++) {
        this.meshes[i].position.copy(this.bodies[i].position);
        this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
      }
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
            this.intersectedObject.material.color.setHex(this.intersectedObject.defaultColor);
          } catch (e) {}
          this.intersectedObject = intersects[0].object;
        } else {
          intersects[0].object.material.color.setHex(0xffffff);
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
      var _this3 = this;

      var translationX = x - this.camera.position.x;
      var translationY = y - this.camera.position.y;
      var translationZ = z - this.camera.position.z;
      var frames = 100;
      for (var i = 0; i < frames; i++) {
        setTimeout(function () {
          _this3.camera.position.x += translationX / frames;
          _this3.camera.position.y += translationY / frames;
          _this3.camera.position.z += translationZ / frames;
        }, i * 1);
      }
    }
  }, {
    key: '_animate',
    value: function _animate(time) {
      this._updateMeshPositions();

      if (time && this.lastTime) {
        var dt = time - this.lastTime;
        this.world.step(this.fixedTimeStep, dt / 1000, this.maxSubSteps);
      }

      this._render();
      this.lastTime = time;
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
