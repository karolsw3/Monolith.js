import LiveObject from './modules/LiveObject.js'
import Player from './modules/Player.js'

class Monolith {
  constructor (settings) {
    this.settings = settings
    this.intersectableObjects = []
    this.referenceObject = {}
    // Three.js
    this.scene = new THREE.Scene()
    this.loader = new THREE.ObjectLoader()
    this.aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.raycaster = new THREE.Raycaster()
    this.intersectedObject = {}

    // Cannon.js
    this.bodies = []
    this.meshes = []
    this.fixedTimeStep = 1 / 60
    this.maxSubSteps = 3

    this._animate = this._animate.bind(this)
    this._onWindowResize = this._onWindowResize.bind(this)
    this._normalizeBodiesPositions = this._normalizeBodiesPositions.bind(this)
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
    this.world.solver.iterations = 12
    this.world.gravity.set(0, -this.settings.gravity, 0)

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    window.addEventListener('resize', this._onWindowResize, false)

    setInterval(this._normalizeBodiesPositions, 100)

    requestAnimationFrame(this._animate)
  }

  createBlock (color, mass) {
    let geometry = new THREE.CubeGeometry(this.settings.blockWidth, this.settings.blockHeight, this.settings.blockWidth)
    let material = new THREE.MeshLambertMaterial({color})
    let shape = new CANNON.Box(new CANNON.Vec3(-0.48 * this.settings.blockWidth, 0.5 * this.settings.blockHeight, -0.48 * this.settings.blockWidth))
    let block = new LiveObject({
      geometry,
      material,
      shape,
      color,
      width: this.settings.blockWidth,
      height: this.settings.blockHeight,
      mass
    })
    return block
  }

  _loadObjectJSON (url, onload) {
    this.loader.load(
      url,
      function (object) {
        onload(object)
      },
      function () {},
      function (err) {
        console.error(err)
      }
    )
  }

  loadObject (url, x, y, z) {
    this._loadObjectJSON(url, (object) => {
      this.scene.add(object)
      this.meshes.push(object)
      let shape = new CANNON.Box(new CANNON.Vec3(-0.48 * this.settings.blockWidth, 0.5 * this.settings.blockHeight, -0.48 * this.settings.blockWidth))
      let body = new CANNON.Body({ mass: 700, material: new CANNON.Material() })
      body.inMove = false
      body.position.set(x, y, z)
      body.addShape(shape)
      this.bodies.push(body)
      this.world.addBody(body)
    })
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    object.body.position.set(-x * w, y * h, -z * w)
    this.world.addBody(object.body)
    this.meshes.push(object.mesh)
    this.bodies.push(object.body)

    this.intersectableObjects.push(object.mesh)
    this.scene.add(object.mesh)
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

  _normalizeBodiesPositions () {
    for (var i = 0; i < this.bodies.length; i++) {
      if (!this.bodies[i].inMove) {
        if (Math.round(this.bodies[i].position.x) !== this.bodies[i].position.x) {
          this.bodies[i].position.x = Math.round(this.bodies[i].position.x / this.settings.blockWidth) * this.settings.blockWidth
        }
        if (Math.round(this.bodies[i].position.z) !== this.bodies[i].position.z) {
          this.bodies[i].position.z = Math.round(this.bodies[i].position.z / this.settings.blockWidth) * this.settings.blockWidth
        }
      }
    }
  }

  // Let the camera follow specified object!
  attachCamera (object) {
    object.cameraAttached = true
    this.referenceObject = object
  }

  _updateMeshPositions () {
    for (var i = 0; i < this.meshes.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position)
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion)
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
