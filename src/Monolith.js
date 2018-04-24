
class Monolith {
  constructor (settings) {
    this.settings = settings
    this.objects = []
    this.objects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ)

    // Three.js
    this.scene = new THREE.Scene()
    this.aspect = window.innerWidth / window.innerHeight
    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.raycaster = new THREE.Raycaster()

    this._animate = this._animate.bind(this)
  }

  init () {
    this.scene.background = new THREE.Color('rgb(53,12,63)')
    this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth)
    this.camera.lookAt(this.scene.position)
    this.camera.position.y = this.settings.sizeY
    this._addLights()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    requestAnimationFrame(this._animate)
  }

  _addLights () {
    this.scene.add(new THREE.AmbientLight(0x444444))
    var spotLightTop = new THREE.SpotLight(0xaaaaaa)
    var spotLightLeft = new THREE.SpotLight(0x444444)
    spotLightTop.position.set(0, 120, 0)
    //spotLightTop.castShadow = true
    spotLightLeft.position.set(120, 120, 120)
    spotLightLeft.castShadow = true

    this.scene.add(spotLightTop)
    this.scene.add(spotLightLeft)
  }

  createBlock (color) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    let block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshLambertMaterial({color: color}))
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
    object.isFalling = !(y === 0 || this.objects[x][y - 1][z] !== 0)
    this.scene.add(object)
  }

  // Let the camera follow specified object!
  attachCamera (object) {
    object.cameraAttached = true
  }

  attachMovementControls (object) {
    object.move = (direction) => {
      let positionBefore = this._getObjectsFixedPosition(object)
      let blockMoved = false
      if (!object.inMotion && object.velocity === 0) {
        switch (direction) {
          case 'right':
            if (!this._checkCollision(object, 'right') && !object.inMotion) {
              for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                  object.position.x += (0.025 * object.geometry.parameters.width)
                }, i * 1)
                blockMoved = true
              }
            }
            break
          case 'backward':
            if (!this._checkCollision(object, 'back') && !object.inMotion) {
              for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                  object.position.z += (0.025 * object.geometry.parameters.depth)
                }, i * 1)
                blockMoved = true
              }
            }
            break
          case 'left':
            if (!this._checkCollision(object, 'left') && !object.inMotion) {
              for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                  object.position.x -= (0.025 * object.geometry.parameters.width)
                }, i * 1)
                blockMoved = true
              }
            }
            break
          case 'forward':
            if (!this._checkCollision(object, 'front') && !object.inMotion) {
              for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                  object.position.z -= (0.025 * object.geometry.parameters.depth)
                }, i * 1)
                blockMoved = true
              }
            }
        }
        object.inMotion = true
        setTimeout(() => {
          object.inMotion = false
          let positionAfter = this._getObjectsFixedPosition(object)
          if (blockMoved) {
            this.objects[positionAfter.x][positionAfter.y][positionAfter.z] = Object.assign({}, this.objects[positionBefore.x][positionBefore.y][positionBefore.z])
            this.objects[positionBefore.x][positionBefore.y][positionBefore.z] = 0

            if (object.cameraAttached) {
              this.smoothlySetCameraPosition(object.position.x + 100, object.position.y + 100, object.position.z + 100)
            }
          }
        }, 40 * 2)
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
    var position = this._getObjectsFixedPosition(object)
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

  /**
   * If objects are not vertically colliding with other objects - make them fall
   * The objects will not fall beneath the ground position (y === 0)
   */
  _makeObjectsFall (acceleration) { // TODO
    for (let x = 0; x < this.settings.sizeX; x++) {
      for (let y = 1; y < this.settings.sizeY; y++) {
        for (let z = 0; z < this.settings.sizeZ; z++) {
          let object = this.objects[x][y][z]
          if (object !== 0) {
            if (!this._checkCollision(object, 'bottom')) {
              object.isFalling = true
              object.velocity += acceleration
              object.position.y -= object.velocity
            } else {
              object.position.y = Math.ceil(object.position.y)
              object.velocity = 0
              // If object is still falling, but the collision has occured - stop it and update its position on objects matrix
              if (object.isFalling) {
                object.isFalling = false
                var position = this._getObjectsFixedPosition(object)
                this.objects[position.x][position.y][position.z] = Object.assign({}, object)
                this.objects[x][y][z] = 0
              }
            }
          }
        }
      }
    }
  }

  _getObjectsFixedPosition (object) {
    var objectX = -Math.round(object.position.x / object.geometry.parameters.width)
    var objectY = Math.ceil(object.position.y / object.geometry.parameters.height)
    var objectZ = -Math.round(object.position.z / object.geometry.parameters.depth)
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
