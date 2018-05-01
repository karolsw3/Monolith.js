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

var Monolith = function () {
  function Monolith(settings) {
    classCallCheck(this, Monolith);

    this.settings = settings;
    this.intersectableObjects = [];
    this.referenceObject = {};
    // Three.js
    this.scene = new THREE.Scene();
    this.aspect = window.innerWidth / window.innerHeight;
    this.geometry = new THREE.BoxGeometry(1, 1, 1, 10, 10);
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.raycaster = new THREE.Raycaster();
    this.intersectedObject = {};

    // Cannon.js
    this.bodies = [];
    this.meshes = [];
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 3;
    this.groundMaterial = new CANNON.Material();
    this.meshMaterial = new CANNON.Material();

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

      // Cannon.js

      this.world = new CANNON.World();
      this.world.gravity.set(0, -this.settings.gravity, 0);
      this._addGround();

      // Create contact material behaviour
      var materialToGroundContact = new CANNON.ContactMaterial(this.groundMaterial, this.meshMaterial, {
        friction: 1,
        restitution: 0,
        contactEquationStiffness: 1e5,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRegularizationTime: 3
      });

      var materialToMaterialContact = new CANNON.ContactMaterial(this.meshMaterial, this.meshMaterial, {
        friction: 1,
        restitution: 0,
        contactEquationStiffness: 1e99,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e834,
        frictionEquationRegularizationTime: 3
      });

      this.world.addContactMaterial(materialToGroundContact);
      this.world.addContactMaterial(materialToMaterialContact);

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
    key: '_addGround',
    value: function _addGround() {
      // Physics
      var shape = new CANNON.Plane();
      var body = new CANNON.Body({ mass: 0, material: this.groundMaterial });
      body.addShape(shape);
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      this.world.addBody(body);
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
    key: 'createBlock',
    value: function createBlock(color) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;

      // Graphics
      var block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: color }));
      this.meshes.push(block);
      block.defaultColor = color;
      return block;
    }
  }, {
    key: 'placeObject',
    value: function placeObject(object, x, y, z) {
      var w = this.settings.blockWidth;
      var h = this.settings.blockHeight;

      if (typeof object.mouseDown === 'undefined') {
        object.mouseDown = function () {};
      }

      // Physics
      var shape = new CANNON.Box(new CANNON.Vec3(0.5 * w, 0.5 * h, 0.5 * w));
      var body = new CANNON.Body({ mass: 5, material: this.meshMaterial });
      body.addShape(shape);
      body.position.set(-x * w, y * h, -z * w);
      this.world.addBody(body);
      this.bodies.push(body);

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
    key: '_moveObjectInCertainDirection',
    value: function _moveObjectInCertainDirection(object, direction) {
      switch (direction) {
        case 'backward':
          direction = 'back';
          break;
        case 'forward':
          direction = 'front';
          break;
      }

      for (var i = 0; i < 40; i++) {
        setTimeout(function () {
          switch (direction) {
            case 'right':
              object.position.x += 0.025 * object.geometry.parameters.width;
              break;
            case 'left':
              object.position.x -= 0.025 * object.geometry.parameters.width;
              break;
            case 'front':
              object.position.z -= 0.025 * object.geometry.parameters.width;
              break;
            case 'back':
              object.position.z += 0.025 * object.geometry.parameters.width;
              break;
          }
        }, i * 1);
      }
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
    key: 'attachMovementControls',
    value: function attachMovementControls(object) {
      var _this2 = this;

      object.move = function (direction) {
        _this2._moveObjectInCertainDirection(object, direction);
        object.position.x = Math.round(object.position.x);
        object.position.z = Math.round(object.position.z);
      };
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
