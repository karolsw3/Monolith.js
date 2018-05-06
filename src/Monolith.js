import LiveObject from './modules/LiveObject.js'
import Player from './modules/Player.js'
import RetardedPhysicsEngine from './modules/RetardedPhysicsEngine.js'

class Monolith {
  constructor (settings) {
    this.settings = settings
    this.loadedObjects = []
    this.intersectableObjects = []
    this.referenceObject = {}
    this.gravity = settings.gravity
    this.meshes = []
    // Three.js
    this.scene = new THREE.Scene()
    this.loader = new THREE.ObjectLoader()
    this.aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.raycaster = new THREE.Raycaster()
    this.intersectedObject = {}

    // RetardedPhysicsEngine.js
    this.retardedPhysicsEngine = new RetardedPhysicsEngine({
      gravity: this.gravity,
      sizeX: 100,
      sizeY: 100,
      sizeZ: 100
    })

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

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    window.addEventListener('resize', this._onWindowResize, false)

    requestAnimationFrame(this._animate)
  }

  createBlock (color) {
    let geometry = new THREE.CubeGeometry(this.settings.blockWidth, this.settings.blockHeight, this.settings.blockWidth)
    let material = new THREE.MeshLambertMaterial({color})
    let object = {}
    object.geometry = geometry
    object.material = material
    let block = new LiveObject(object)
    return block
  }

  _getObjectJSON (url, onload) {
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

  loadObjects (objects) {
    for (let i = 0; i < objects.length; i++) {
      this._getObjectJSON(objects[i].url, (object) => {
        let liveObject = new LiveObject(object)
        this.loadedObjects[objects[i].name] = liveObject
      })
    }
  }

  loadObject (url, x, y, z) {
    this._getObjectJSON(url, (object) => {
      this.scene.add(object)
      this.meshes.push(object)
    })
  }

  placeObject (object, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight

    object.position.set(-x * w, y * h, -z * w)
    this.meshes.push(object.mesh)

    this.intersectableObjects.push(object.mesh)
    this.scene.add(object.mesh)

    // RetardedPhysicsEngine.js
    this.retardedPhysicsEngine.addObject(object)
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

  // Let the camera follow specified object!
  attachCamera (object) {
    object.cameraAttached = true
    this.referenceObject = object
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
    this._render()
    requestAnimationFrame(this._animate)
  }

  _render () {
    this.renderer.render(this.scene, this.camera)
  }
}
