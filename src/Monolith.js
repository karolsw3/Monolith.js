import LiveObject from './modules/LiveObject.js'
import Utils from './modules/Utils.js'
import RetardedPhysicsEngine from './modules/RetardedPhysicsEngine.js'

class Monolith {
  constructor (settings) {
    this.utils = new Utils()
    this.settings = settings
    this.loadedMeshes = []
    this.onMeshesLoad = () => {}
    this.intersectableObjects = []
    this.referenceObject = {}
    this.gravity = settings.gravity
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
    this.camera.position.y = 100
    this.camera.position.x = 100
    this.camera.position.z = 100
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

        if (positionAfter.y > 0 && this.retardedPhysicsEngine.objectsMatrix[positionAfter.x][positionAfter.y - 1][positionAfter.z] === 0) {
          this.letAllFloatingObjectsFall()
        }

        if (object.cameraAttached) {
          this.smoothlySetCameraPosition(positionAfter)
        }
      })
    }
  }

  createBlock (color) {
    let geometry = new THREE.CubeGeometry(this.grid.width, this.grid.height, this.grid.depth)
    let material = new THREE.MeshLambertMaterial({color})
    let mesh = new THREE.Mesh(geometry, material)
    let object = {}
    object.mesh = mesh
    object.stepDistance = this.grid.width
    let block = new LiveObject(object)
    return block
  }

  createObjectFromMesh (mesh) {
    let object = new LiveObject({
      mesh: mesh.clone(),
      stepDistance: this.grid.width
    })
    return object
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

  loadMeshes (meshes) {
    let meshesLoadedCount = 0
    for (let i = 0; i < meshes.length; i++) {
      this._getObjectJSON(meshes[i].url, (mesh) => {
        this.loadedMeshes[meshes[i].name] = mesh
        meshesLoadedCount++
        if (meshesLoadedCount === meshes.length) {
          this.onMeshesLoad()
        }
      })
    }
  }

  placeObject (object, x, y, z) {
    let w = this.grid.width
    let h = this.grid.height

    object.position.set(-x * w, y * h, -z * w)

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
    gridHelper.position.set(this.grid.width / 2, -this.grid.height / 2, this.grid.depth / 2)
    this.scene.add(gridHelper)
  }

  mouseMove (event) {
    event.preventDefault()
    let mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    this.raycaster.setFromCamera(mouse3D, this.camera)
    let intersects = this.raycaster.intersectObjects(this.intersectableObjects)
    intersects.forEach((object) => {
      object.object.mouseMove()
    })
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

  smoothlySetCameraPosition (position) {
    let translationX = -position.x * this.grid.width - this.camera.position.x
    let translationZ = -position.z * this.grid.depth - this.camera.position.z
    let frames = 100
    for (let i = 0; i < frames; i++) {
      setTimeout(() => {
        this.camera.position.x += translationX / frames + 1
        this.camera.position.z += translationZ / frames + 1
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
