class Monolith {
  constructor (settings) {
    this.settings = settings
    this.intersectableObjects = []
    this.objects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ)
    this.objectsWhichShouldFall = []
    this.referenceObject = {}
    // Three.js
    this.scene = new THREE.Scene()
    this.aspect = window.innerWidth / window.innerHeight
    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.raycaster = new THREE.Raycaster()
    this.intersectedObject = {}

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

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    requestAnimationFrame(this._animate)
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
    let block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({color: color}))
    block.defaultColor = color
    block.velocity = 0
    block.inMotion = false
    return block
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    object.position.x = -x * w
    object.position.y = y * h
    object.position.z = -z * w
    this.objects[x][y][z] = object
    if (typeof object.mouseDown === 'undefined') {
      object.mouseDown = () => {}
    }

    if (this._checkIfObjectShouldFall(object)) {
      object.isFalling = true
      this.objectsWhichShouldFall.push(object)
    }

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

    if (!this._checkCollision(object, direction) && !object.inMotion) {
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
  }

  _updateObjectsPositionInMatrix (object, positionBefore) {
    let positionAfter = this._getObjectsFixedPosition(object)
    this.objects[positionAfter.x][positionAfter.y][positionAfter.z] = Object.assign({}, this.objects[positionBefore.x][positionBefore.y][positionBefore.z])
    this.objects[positionBefore.x][positionBefore.y][positionBefore.z] = 0

    for (let y = 1; y < this.settings.sizeY - positionBefore.y; y++) {
      if (this.objects[positionBefore.x][positionBefore.y + y][positionBefore.z] !== 0) {
        let objectToCheck = this.objects[positionBefore.x][positionBefore.y + y][positionBefore.z]
        if (this._checkIfObjectShouldFall(objectToCheck)) {
          objectToCheck.isFalling = true
          this.objectsWhichShouldFall.push(objectToCheck)
        }
      }
    }
    if (this._checkIfObjectShouldFall(object)) {
      object.isFalling = true
      this.objectsWhichShouldFall.push(object)
    }
    if (object.cameraAttached) {
      this.smoothlySetCameraPosition(object.position.x + 100, object.position.y + 100, object.position.z + 100)
    }
  }

  attachMovementControls (object) {
    object.move = (direction) => {
      let positionBefore = this._getObjectsFixedPosition(object)
      let blockMoved = false
      if (!object.inMotion && object.velocity === 0) {
        this._moveObjectInCertainDirection(object, direction)
        blockMoved = true
        object.inMotion = true
        if (blockMoved) {
          setTimeout(() => {
            this._updateObjectsPositionInMatrix(object, positionBefore)
          }, 40 * 2)
        }
        object.inMotion = false
      }
      object.position.x = Math.round(object.position.x)
      object.position.z = Math.round(object.position.z)
    }
  }

  _animate () {
    this._render()
    this._makeObjectsFall(this.settings.gravity)
    requestAnimationFrame(this._animate)
  }

  /**
   * Check collision with specified object and its neighbour at specified direction
   */
  _checkCollision (object, direction) {
    let position = this._getObjectsFixedPosition(object)
    let neighbour
    switch (direction) {
      case 'bottom':
        neighbour = this.objects[position.x][position.y - 1][position.z]
        return (neighbour !== 0 && !neighbour.isFalling)
      case 'top':
        neighbour = this.objects[position.x][position.y + 1][position.z]
        return (neighbour !== 0 && !neighbour.isFalling)
      case 'left':
        neighbour = this.objects[position.x + 1][position.y][position.z]
        return (neighbour !== 0 && !neighbour.isFalling)
      case 'right':
        neighbour = this.objects[position.x - 1][position.y][position.z]
        return (neighbour !== 0 && !neighbour.isFalling)
      case 'front':
        neighbour = this.objects[position.x][position.y][position.z + 1]
        return (neighbour !== 0 && !neighbour.isFalling)
      case 'back':
        neighbour = this.objects[position.x][position.y][position.z - 1]
        return (neighbour !== 0 && !neighbour.isFalling)
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

  _checkIfObjectShouldFall (object) {
    let position = this._getObjectsFixedPosition(object)
    if (object !== 0) {
      if (position.y > 0 && (this.objects[position.x][position.y - 1][position.z].isFalling || this.objects[position.x][position.y - 1][position.z] === 0)) {
        return true
      }
    }
    return false
  }

  /**
   * If objects are not vertically colliding with other objects - make them fall
   * The objects will not fall beneath the ground position (y === 0)
   */
  _makeObjectsFall (acceleration) {
    this.objectsWhichShouldFall.forEach((object, index) => {
      let positionBefore = this._getObjectsFixedPosition(object)
      if (object !== 0 && this._checkIfObjectIsWithinRenderDistance(object)) {
        if (!this._checkCollision(object, 'bottom')) {
          object.velocity += acceleration
          object.position.y -= object.velocity
        } else {
          object.position.y = Math.ceil(object.position.y)
          object.velocity = 0
          object.isFalling = false
          this.objectsWhichShouldFall.splice(index, 1)
        }
        let positionAfter = this._getObjectsFixedPosition(object)
        this.objects[positionBefore.x][Math.round(positionBefore.y)][positionBefore.z] = 0
        this.objects[positionAfter.x][Math.round(positionAfter.y)][positionAfter.z] = Object.assign({}, object)
      }
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

  _render () {
    this.renderer.render(this.scene, this.camera)
  }

  _create3DArray (sizeX, sizeY, sizeZ) {
    let array = []
    for (let x = 0; x < sizeX; x++) {
      array[x] = []
      for (let y = 0; y < sizeY; y++) {
        array[x][y] = []
        for (let z = 0; z < sizeZ; z++) {
          array[x][y][z] = 0
        }
      }
    }
    return array
  }
}
