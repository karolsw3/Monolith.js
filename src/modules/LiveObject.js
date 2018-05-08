class LiveObject {
  constructor (object) {
    this.inMove = false
    this.horizontalCollision = false

    // Graphics
    this.mesh = new THREE.Mesh(object.geometry, object.material)
    this.mesh.mouseDown = () => {}
    this.mesh.defaultColor = this.mesh.material.color
    this.position = this.mesh.position
    this.width = this.mesh.geometry.parameters.width
    this.position.set = (x, y, z) => {
      this.position.x = x
      this.position.y = y
      this.position.z = z
    }
  }

  move (direction, callback) {
    if (!this.inMove) {
      this.inMove = true
      this.previousPosition = {x: this.position.x, y: this.position.y, z: this.position.z}
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          switch (direction) {
            case 'right':
              this.position.x += this.width / 3 * 0.05
              break
            case 'left':
              this.position.x -= this.width / 3 * 0.05
              break
            case 'forward':
              this.position.z -= this.width / 3 * 0.05
              break
            case 'backward':
              this.position.z += this.width / 3 * 0.05
              break
          }
        }, 1 * i)
      }
      setTimeout(() => {
        this.inMove = false
        callback()
      }, 61)
    }
  }
}

export default LiveObject
