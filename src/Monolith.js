
class Monolith {
  constructor (settings) {
    this.settings = settings
    this.objects = []

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
    return block
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    object.position.x = -x * w
    object.position.y = y * h
    object.position.z = -z * w
    this.objects.push(object)
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

  attachQEADControls (object) {
    window.addEventListener('keydown', (event) => {
      var keyCode = event.keyCode
      switch (keyCode) {
        case 68: // d
          object.position.x += object.geometry.parameters.width
          break
        case 69: // e
          object.position.z -= object.geometry.parameters.depth
          break
        case 65: // a
          object.position.z += object.geometry.parameters.depth
          break
        case 81: // q
          object.position.x -= object.geometry.parameters.width
          break
      }
    }, false)
  }

  _animate () {
    this._render()
    this._makeObjectsFall(this.settings.gravity)
    requestAnimationFrame(this._animate)
  }

  // Check if specified object collides vertically with any other object
  _checkVerticalObjectCollision (object) {
    var originPoint = object.position.clone()
    var localVertex = object.geometry.vertices[3].clone()
    var globalVertex = localVertex.applyMatrix4(object.matrix)
    var directionVector = globalVertex.sub(object.position)

    var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize())
    var collisionResults = ray.intersectObjects(this.objects)
    if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
      return true
    }
    return false
  }

  /**
   * If objects are not vertically colliding with other objects - make them fall
   * The objects will not fall beneath the ground position (y = 0)
   */
  _makeObjectsFall (acceleration) {
    for (let i = 0; i < this.objects.length; i++) {
      if (this.objects[i].position.y > 0) {
        if (this._checkVerticalObjectCollision(this.objects[i]) === false) {
          this.objects[i].velocity += acceleration
          this.objects[i].position.y -= this.objects[i].velocity
        } else {
          this.objects[i].position.y = Math.ceil(this.objects[i].position.y)
          this.objects[i].velocity = 0
        }
      }
    }
  }

  _render () {
    this.renderer.render(this.scene, this.camera)
  }
}
