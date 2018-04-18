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
    this.scene.background = new THREE.Color('rgb(23,0,0)')
    this.scene.add(new THREE.AmbientLight(0x444444))
    this.scene.add(new THREE.AxesHelper(40))
    this.camera.position.set(this.settings.blockWidth, this.settings.blockWidth, this.settings.blockWidth)
    this.camera.lookAt(this.scene.position)

    var light = new THREE.AmbientLight(0x404040)
    this.scene.add(light)

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    requestAnimationFrame(this._animate)
  }

  placeBlock (x, y, z) {
    let w = this.settings.blockWidth
    let h = this.settings.blockHeight
    let block = new THREE.Mesh(new THREE.CubeGeometry(w, h, w), new THREE.MeshNormalMaterial())
    block.position.x = x * w
    block.position.y = y * h
    block.position.z = z * w
    this.scene.add(block)
  }

  _animate () {
    this._render()
    requestAnimationFrame(this._animate)
  }

  _render () {
    this.renderer.render(this.scene, this.camera)
  }
}
