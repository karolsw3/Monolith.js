import * as THREE from 'three'

class Monolith {
  constructor (settings) {
    this.settings = settings

    // Three.js
    this.scene = new THREE.Scene()
    this.aspect = window.innerWidth / window.innerHeight
    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    this.camera = new THREE.OrthographicCamera(-20 * this.aspect, 20 * this.aspect, 20, -20, 1, 1000)
    this.renderer = new THREE.WebGLRenderer()

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
    this.renderer.shadowMapEnabled = true
    document.body.appendChild(this.renderer.domElement)

    requestAnimationFrame(this._animate)
  }

  _addGrid () {
    let w = this.settings.blockWidth
    let e = 100
    var geometry = new THREE.PlaneBufferGeometry(w * e, w * e, w * e, w * e)
    var material = new THREE.MeshBasicMaterial({ wireframe: true, opacity: 0.1, transparent: true })
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
    return block
  }

  placeBlock (block, x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    block.position.x = -x * w
    block.position.y = y * h
    block.position.z = -z * w
    this.scene.add(block)
  }

  generateFloor (length, width) {
    for (let x = 0; x < length; x++) {
      for (let z = 0; z < width; z++) {
        if ((x % 2 === 0 && z % 2 === 0) || (x % 2 === 1 && z % 2 === 1)) {
          this.placeBlock(this.createBlock(0x44ff55), x, 0, z)
        } else {
          this.placeBlock(this.createBlock(0x33ee44), x, 0, z)
        }
      }
    }
  }

  _animate () {
    this._render()
    requestAnimationFrame(this._animate)
  }

  _render () {
    this.renderer.render(this.scene, this.camera)
  }
}
