import LiveObject from './modules/LiveObject.js'
import Utils from './modules/Utils.js'
import RetardedPhysicsEngine from './modules/RetardedPhysicsEngine.js'

class Monolith {
  constructor (settings) {
    this.utils = new Utils()
    this.settings = settings
    this.loadedObjects = []
    this.intersectableObjects = []
    this.referenceObject = {}
    this.gravity = settings.gravity
    this.meshes = []
    this.grid = settings.grid
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
      grid: this.settings.grid,
      sizeX: this.settings.sizeX,
      sizeY: this.settings.sizeY,
      sizeZ: this.settings.sizeZ
    })

    this._animate = this._animate.bind(this)
    this._onWindowResize = this._onWindowResize.bind(this)
  }

  init () {
    this.scene.background = new THREE.Color(this.settings.backgroundColor)
    this.camera.position.set(this.grid.width, this.grid.width, this.grid.width)
    this.camera.lookAt(this.scene.position)
    this.camera.position.y = 20
    this._addLights()
    this._addGrid()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('mousedown', e => this.mouseDown(e))
    window.addEventListener('mousemove', e => this.mouseMove(e))
    window.addEventListener('resize', this._onWindowResize, false)

    requestAnimationFrame(this._animate)
  }

  letAllFloatingObjectsFall () {
    this.retardedPhysicsEngine.checkAllObjectsIfTheyShouldFall()
    this.retardedPhysicsEngine.makeObjectsFall()
  }

  moveObject (object, direction) {
    let positionBefore = this.utils.getObjectsFixedPosition(object.position, this.grid)
    if (!this.retardedPhysicsEngine.checkCollision(object, direction) && !object.isMoving && !object.isFalling) {
      object.move(direction, () => {
        let positionAfter = this.utils.getObjectsFixedPosition(object.position, this.grid)
        this.retardedPhysicsEngine.objectsMatrix[positionAfter.x][positionAfter.y][positionAfter.z] = object
        this.retardedPhysicsEngine.objectsMatrix[positionBefore.x][positionBefore.y][positionBefore.z] = 0
        this.letAllFloatingObjectsFall()
      })
    }
  }

  createBlock (color) {
    let geometry = new THREE.CubeGeometry(this.grid.width, this.grid.height, this.grid.depth)
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
    let w = this.grid.width
    let h = this.grid.height

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

  _addGrid () {
    let k = 10
    let size = this.settings.sizeX * this.grid.width * k
    let divisions = this.settings.sizeX * k
    let gridHelper = new THREE.GridHelper(size, divisions)
    gridHelper.position.set(this.grid.width / 2, this.grid.height / 2, this.grid.depth / 2)
    this.scene.add(gridHelper)
  }

  mouseMove (event) {
    event.preventDefault()
    let mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    this.raycaster.setFromCamera(mouse3D, this.camera)
    let intersects = this.raycaster.intersectObjects(this.intersectableObjects)
    if (typeof intersects[0] === 'object') {
      if (this.intersectedObject.id !== intersects[0].object.id) {
        try {
          this.intersectedObject.material.color = {r: this.intersectedObject.defaultColor.r, g: this.intersectedObject.defaultColor.g, b: this.intersectedObject.defaultColor.b}
        } catch (e) {}
        this.intersectedObject = intersects[0].object
      } else {
        intersects[0].object.material.color = {r: 255, g: 255, b: 255}
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
    let position = this.utils.getObjectsFixedPosition(object.position, this.settings.grid)
    let referencePosition = this.utils.getObjectsFixedPosition(this.referenceObject.position, this.settings.grid)
    return (
      position.x > referencePosition.x - this.settings.renderDistance * this.grid.width &&
      position.x < referencePosition.x + this.settings.renderDistance * this.grid.width &&
      position.z > referencePosition.z - this.settings.renderDistance * this.grid.width &&
      position.z < referencePosition.z + this.settings.renderDistance * this.grid.width
    )
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
