
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
    this.scene.add(new THREE.AxesHelper(60))
    this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth)
    this.camera.lookAt(this.scene.position)
    this._addLights()
    this._addGrid()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    requestAnimationFrame(this._animate)
  }

  _addGrid () {
    let w = this.settings.blockWidth
    let e = 100
    var geometry = new THREE.PlaneBufferGeometry(w * e, w * e, w * e, w * e)
    var material = new THREE.MeshBasicMaterial({ wireframe: true, opacity: 0.05, transparent: true })
    var grid = new THREE.Mesh(geometry, material)
    grid.rotation.order = 'YXZ'
    grid.rotation.y = -Math.PI / 2
    grid.rotation.x = -Math.PI / 2
    this.scene.add(grid)
  }

  _addLights () {
    this.scene.add(new THREE.AmbientLight(0x444444))
    var spotLightTop = new THREE.SpotLight(0xaaaaaa)
    var spotLightLeft = new THREE.SpotLight(0x444444)
    spotLightTop.position.set(0, 120, 0)
    spotLightTop.castShadow = true
    spotLightLeft.position.set(0, 0, 120)
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

  generateFloor (length, width) {
    for (let x = 0; x < length; x++) {
      for (let z = 0; z < width; z++) {
        if ((x % 2 === 0 && z % 2 === 0) || (x % 2 === 1 && z % 2 === 1)) {
          this.placeObject(this.createBlock(0x44ff55), x, 0, z)
        } else {
          this.placeObject(this.createBlock(0x33ee44), x, 0, z)
        }
      }
    }
    this.camera.position.y = this.settings.blockWidth * (length / 2)
  }

  attachMovementControls (object) {
    object.move = (direction) => {
      let positionBefore = this._getObjectsFixedPosition(object)
      let blockMoved = false
      if (!object.inMotion) {
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
            if (!this._checkCollision(object, 'front') && !object.inMotion) {
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
            if (!this._checkCollision(object, 'back') && !object.inMotion) {
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

  _checkCollision (object, direction) {
    var position = this._getObjectsFixedPosition(object)
    switch (direction) {
      case 'bottom':
        return (this.objects[position.x][position.y - 1][position.z] !== 0 && !this.objects[position.x][position.y - 1][position.z].isFalling)
      case 'top':
        return (this.objects[position.x][position.y + 1][position.z] !== 0 && !this.objects[position.x][position.y + 1][position.z].isFalling)
      case 'left':
        return (this.objects[position.x + 1][position.y][position.z] !== 0 && !this.objects[position.x + 1][position.y][position.z].isFalling)
      case 'right':
        return (this.objects[position.x - 1][position.y][position.z] !== 0 && !this.objects[position.x - 1][position.y][position.z].isFalling)
      case 'front':
        return (this.objects[position.x][position.y][position.z - 1] !== 0 && !this.objects[position.x][position.y][position.z - 1].isFalling)
      case 'back':
        return (this.objects[position.x][position.y][position.z + 1] !== 0 && !this.objects[position.x][position.y][position.z + 1].isFalling)
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
          if (this.objects[x][y][z] !== 0) {
            if (!this._checkCollision(this.objects[x][y][z], 'bottom')) {
              this.objects[x][y][z].isFalling = true
              this.objects[x][y][z].velocity += acceleration
              this.objects[x][y][z].position.y -= this.objects[x][y][z].velocity
            } else {
              this.objects[x][y][z].position.y = Math.ceil(this.objects[x][y][z].position.y)
              this.objects[x][y][z].velocity = 0
              if (this.objects[x][y][z].isFalling) {
                this.objects[x][y][z].isFalling = false
                var position = this._getObjectsFixedPosition(this.objects[x][y][z])
                this.objects[position.x][position.y][position.z] = Object.assign({}, this.objects[x][y][z])
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
