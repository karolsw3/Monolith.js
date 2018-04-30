class Monolith {
  constructor (settings) {
    this.settings = settings
    this.intersectableObjects = []
    this.referenceObject = {}
    // Three.js
    this.scene = new THREE.Scene()
    this.aspect = window.innerWidth / window.innerHeight
    this.geometry = new THREE.BoxGeometry(1, 1, 1, 10, 10)
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.raycaster = new THREE.Raycaster()
    this.intersectedObject = {}

    // Cannon.js
    this.bodies = []
    this.meshes = []
    this.fixedTimeStep = 1 / 60
    this.maxSubSteps = 3
    this.groundMaterial = new CANNON.Material()
    this.meshMaterial = new CANNON.Material()

    this._animate = this._animate.bind(this)
  }

  init () {
    this.scene.background = new THREE.Color(this.settings.backgroundColor)
    this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth)
    this.camera.lookAt(this.scene.position)
    this.camera.position.y = this.settings.sizeY
    this._addLights()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Cannon.js

    this.world = new CANNON.World()
    this.world.gravity.set(0, -this.settings.gravity, 0)
    this._addGround()

    // Create contact material behaviour
    let materialToGroundContact = new CANNON.ContactMaterial(this.groundMaterial, this.meshMaterial, {
      friction: 1,
      restitution: 0,
      contactEquationStiffness: 1e5,
      contactEquationRelaxation: 20
    })

    let materialToMaterialContact = new CANNON.ContactMaterial(this.meshMaterial, this.meshMaterial, {
      friction: 1,
      restitution: 0,
      contactEquationStiffness: 1e5,
      contactEquationRelaxation: 20
    })

    this.world.addContactMaterial(materialToGroundContact)
    this.world.addContactMaterial(materialToMaterialContact)

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    requestAnimationFrame(this._animate)
  }

  _addGround () {
    // Physics
    let shape = new CANNON.Plane()
    let body = new CANNON.Body({ mass: 0, material: this.groundMaterial })
    body.addShape(shape)
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    this.world.addBody(body)
    this.bodies.push(body)

    // Graphics
    let geometry = new THREE.PlaneGeometry(100, 100, 1, 1)
    let mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: this.settings.backgroundColor}))
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    this.scene.add(mesh)
    this.meshes.push(mesh)
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

  createBlock (color) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    // Graphics
    let block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({color: color}))
    this.meshes.push(block)
    block.defaultColor = color
    return block
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    if (typeof object.mouseDown === 'undefined') {
      object.mouseDown = () => {}
    }

    // Physics
    var shape = new CANNON.Box(new CANNON.Vec3(0.5 * w, 0.5 * h, 0.5 * w))
    var body = new CANNON.Body({ mass: 5, material: this.meshMaterial })
    body.addShape(shape)
    body.position.set(-x * w, y * h, -z * w)
    this.world.addBody(body)
    this.bodies.push(body)

    this.intersectableObjects.push(object)
    this.scene.add(object)
  }

  // Let the camera follow specified object!
  attachCamera (object) {
    object.cameraAttached = true
    this.referenceObject = object
  }

  _moveObjectInCertainDirection (object, direction) {
    switch (direction) {
      case 'backward':
        direction = 'back'
        break
      case 'forward':
        direction = 'front'
        break
    }

    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        switch (direction) {
          case 'right':
            object.position.x += (0.025 * object.geometry.parameters.width)
            break
          case 'left':
            object.position.x -= (0.025 * object.geometry.parameters.width)
            break
          case 'front':
            object.position.z -= (0.025 * object.geometry.parameters.width)
            break
          case 'back':
            object.position.z += (0.025 * object.geometry.parameters.width)
            break
        }
      }, i * 1)
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
