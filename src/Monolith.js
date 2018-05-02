class Monolith {
  constructor (settings) {
    this.settings = settings
    this.intersectableObjects = []
    this.referenceObject = {}
    // Three.js
    this.scene = new THREE.Scene()
    this.aspect = window.innerWidth / window.innerHeight
    this.geometry = new THREE.BoxGeometry(3, 1, 3, 10, 10)
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.raycaster = new THREE.Raycaster()
    this.intersectedObject = {}

    // Cannon.js
    this.bodies = []
    this.meshes = []
    this.fixedTimeStep = 1 / 60
    this.maxSubSteps = 3
    this.meshMaterial = new CANNON.Material()

    this._animate = this._animate.bind(this)
    this._onWindowResize = this._onWindowResize.bind(this)
  }

  init () {
    this.scene.background = new THREE.Color(this.settings.backgroundColor)
    this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth)
    this.camera.lookAt(this.scene.position)
    this.camera.position.y = 20
    this._addLights()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Cannon.js

    this.world = new CANNON.World()
    this.world.broadphase = new CANNON.NaiveBroadphase()
    this.world.solver.iterations = 10
    this.world.gravity.set(0, -this.settings.gravity, 0)

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    window.addEventListener('resize', this._onWindowResize, false)

    setInterval(() => {
      for (var i = 0; i < this.meshes.length; i++) {
        if (!this.bodies[i].inMove) {
          if (Math.round(this.bodies[i].position.x) !== this.bodies[i].position.x) {
            this.bodies[i].position.x = Math.round(this.bodies[i].position.x / this.settings.blockWidth) * this.settings.blockWidth
          }
          if (Math.round(this.bodies[i].position.z) !== this.bodies[i].position.z) {
            this.bodies[i].position.z = Math.round(this.bodies[i].position.z / this.settings.blockWidth) * this.settings.blockWidth
          }
        }
      }
    }, 100)

    requestAnimationFrame(this._animate)
  }

  _onWindowResize () {
    this.camera.left = -20 * window.innerWidth / window.innerHeight
    this.camera.right = 20 * window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  _addLights () {
    this.scene.add(new THREE.AmbientLight(0xbbbbbb))
    let spotLightTop = new THREE.SpotLight(0x444444)
    let spotLightLeft = new THREE.SpotLight(0x222222)
    spotLightTop.position.set(0, 1000, 0)
    spotLightLeft.position.set(0, 0, 1000)

    this.scene.add(spotLightTop)
    this.scene.add(spotLightLeft)
  }

  createBlock (color, mass = 0) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    // Graphics
    let block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({color: color}))
    this.meshes.push(block)
    block.defaultColor = color
    block.mass = mass

    // Physics
    var shape = new CANNON.Box(new CANNON.Vec3(-0.48 * w, 0.5 * h, -0.48 * w))
    var body = new CANNON.Body({ mass: mass, material: this.meshMaterial })
    body.addShape(shape)
    body.angularDamping = 1
    body.fixedRotation = true
    block.body = body
    return block
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    if (typeof object.mouseDown === 'undefined') {
      object.mouseDown = () => {}
    }

    object.body.position.set(-x * w, y * h, -z * w)
    this.world.addBody(object.body)
    this.bodies.push(object.body)

    this.intersectableObjects.push(object)
    this.scene.add(object)
  }

  // Let the camera follow specified object!
  attachCamera (object) {
    object.cameraAttached = true
    this.referenceObject = object
  }

  _moveObjectInCertainDirection (object, direction) {
    if (!object.body.inMove) {
      object.body.inMove = true
      object.body.position.y += this.settings.blockHeight * 0.1
      object.body.previousPosition = {x: object.body.position.x, y: object.body.position.y, z: object.body.position.z}
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          if (!object.body.horizontalCollision) {
            switch (direction) {
              case 'right':
                object.body.position.x += this.settings.blockWidth / 3 * 0.048
                break
              case 'left':
                object.body.position.x -= this.settings.blockWidth / 3 * 0.048
                break
              case 'forward':
                object.body.position.z -= this.settings.blockWidth / 3 * 0.048
                break
              case 'backward':
                object.body.position.z += this.settings.blockWidth / 3 * 0.048
                break
            }
          } else {
            object.body.position.set(object.body.previousPosition.x, object.body.previousPosition.y, object.body.previousPosition.z)
          }
        }, 1 * i)

        setTimeout(() => {
          object.body.velocity.y = 0
        }, 110)

        setTimeout(() => {
          if (object.body.horizontalCollision) { 
            object.body.position.set(object.body.previousPosition.x, object.body.previousPosition.y, object.body.previousPosition.z)
          }
          object.body.position.x = Math.round(object.body.position.x)
          object.body.velocity.x = 0
          object.body.velocity.z = 0
          object.body.position.z = Math.round(object.body.position.z)
        }, 81)

        setTimeout(() => {
          object.body.inMove = false
          object.body.horizontalCollision = false
        }, 100)
      }
    }
  }

  _updateMeshPositions () {
    for (var i = 0; i < this.meshes.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position)
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion)     
    }
  }

  attachMovementControls (object) {
    object.move = (direction) => {
      this._moveObjectInCertainDirection(object, direction)
      object.position.x = Math.round(object.position.x)
      object.position.z = Math.round(object.position.z)
    }

    object.body.addEventListener('collide', (e) => {
      if (Math.round(e.body.position.y) === Math.ceil(object.body.position.y)) {
        object.body.horizontalCollision = true
      }
    }, false)
  }

  mouseMove (event) {
    event.preventDefault()
    let mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    this.raycaster.setFromCamera(mouse3D, this.camera)
    let intersects = this.raycaster.intersectObjects(this.intersectableObjects)
    if (typeof intersects[0] === 'object') {
      if (this.intersectedObject.id !== intersects[0].object.id) {
        try {
          this.intersectedObject.material.color.setHex(this.intersectedObject.defaultColor)
        } catch (e) {}
        this.intersectedObject = intersects[0].object
      } else {
        intersects[0].object.material.color.setHex(0xffffff)
      }
    }
  }

  mouseDown (event) {
    event.preventDefault()
    let mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    this.raycaster.setFromCamera(mouse3D, this.camera)
    let intersects = this.raycaster.intersectObjects(this.intersectableObjects)
    intersects.forEach((object) => {
      object.object.mouseDown()
    })
  }

  _checkIfObjectIsWithinRenderDistance (object) {
    let position = this._getObjectsFixedPosition(object)
    let referencePosition = this._getObjectsFixedPosition(this.referenceObject)
    return (
      position.x > referencePosition.x - this.settings.renderDistance * this.settings.blockWidth &&
      position.x < referencePosition.x + this.settings.renderDistance * this.settings.blockWidth &&
      position.z > referencePosition.z - this.settings.renderDistance * this.settings.blockWidth &&
      position.z < referencePosition.z + this.settings.renderDistance * this.settings.blockWidth
    )
  }

  _getObjectsFixedPosition (object) {
    let objectX = -Math.round(object.position.x / object.geometry.parameters.width)
    let objectY = Math.ceil(object.position.y / object.geometry.parameters.height)
    let objectZ = -Math.round(object.position.z / object.geometry.parameters.depth)
    return {
      x: objectX,
      y: objectY,
      z: objectZ
    }
  }

  smoothlySetCameraPosition (x, y, z) {
    let translationX = x - this.camera.position.x
    let translationY = y - this.camera.position.y
    let translationZ = z - this.camera.position.z
    let frames = 100
    for (let i = 0; i < frames; i++) {
      setTimeout(() => {
        this.camera.position.x += translationX / frames
        this.camera.position.y += translationY / frames
        this.camera.position.z += translationZ / frames
      }, i * 1)
    }
  }

  _animate (time) {
    this._updateMeshPositions()

    if (time && this.lastTime) {
      var dt = time - this.lastTime
      this.world.step(this.fixedTimeStep, dt / 1000, this.maxSubSteps)
    }

    this._render()
    this.lastTime = time
    requestAnimationFrame(this._animate)
  }

  _render () {
    this.renderer.render(this.scene, this.camera)
  }
}
