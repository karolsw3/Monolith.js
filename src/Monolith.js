import ObjectMethods from './modules/ObjectMethods.js'

class Monolith {
  constructor (settings) {
    this.settings = settings
    this.objects = []
    this.stableObjects = this._create3DArray(this.settings.sizeX, this.settings.sizeY, this.settings.sizeZ)

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
    let methods = new ObjectMethods()
    block.methods = methods
    return block
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    object.position.x = -x * w
    object.position.y = y * h
    object.position.z = -z * w
    this.stableObjects[x][y][z] = object
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
      for (let i = 0; i < 100; i++) {
        switch (direction) {
          case 'right':
            if (!this._checkCollision(object, 'right')) {
              setTimeout(() => {
                object.position.x += (0.01 * object.geometry.parameters.width)
              }, i * 1)
            }
            break
          case 'down':
            if (!this._checkCollision(object, 'front')) {
              setTimeout(() => {
                object.position.z += (0.01 * object.geometry.parameters.depth)
              }, i * 1)
            }
            break
          case 'left':
            if (!this._checkCollision(object, 'left')) {
              setTimeout(() => {
                object.position.x -= (0.01 * object.geometry.parameters.width)
              }, i * 1)
            }
            break
          case 'up':
            if (!this._checkCollision(object, 'back')) {
              setTimeout(() => {
                object.position.z -= (0.01 * object.geometry.parameters.depth)
              }, i * 1)
            }
        }
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
    var objectX = -Math.round(object.position.x / object.geometry.parameters.width)
    var objectY = Math.round(object.position.y / object.geometry.parameters.height)
    var objectZ = -Math.round(object.position.z / object.geometry.parameters.depth)
    switch (direction) {
      case 'bottom':
        return this.stableObjects[objectX][objectY - 1][objectZ] !== 0
      case 'top':
        return this.stableObjects[objectX][objectY + 1][objectZ] !== 0
      case 'left':
        return this.stableObjects[objectX + 1][objectY][objectZ] !== 0
      case 'right':
        return this.stableObjects[objectX - 1][objectY][objectZ] !== 0
      case 'front':
        return this.stableObjects[objectX][objectY][objectZ - 1] !== 0
      case 'back':
        return this.stableObjects[objectX][objectY][objectZ + 1] !== 0
    }
  }

  /**
   * If objects are not vertically colliding with other objects - make them fall
   * The objects will not fall beneath the ground position (y = 0)
   */
  _makeObjectsFall (acceleration) { // TODO
    for (let x = 0; x < this.settings.sizeX; x++) {
      for (let y = 1; y < this.settings.sizeY; y++) {
        for (let z = 0; z < this.settings.sizeZ; z++) {
          if (this.stableObjects[x][y][z] !== 0) {
            if (!this._checkCollision(this.stableObjects[x][y][z], 'bottom')) {
              this.stableObjects[x][y][z].velocity += acceleration
              this.stableObjects[x][y][z].position.y -= this.stableObjects[x][y][z].velocity
            } else {
              this.stableObjects[x][y][z].position.y = Math.ceil(this.stableObjects[x][y][z].position.y)
              this.stableObjects[x][y][z].velocity = 0
            }
          }
        }
      }
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
