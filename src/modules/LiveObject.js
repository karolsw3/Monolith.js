class LiveObject {
  constructor (object) {
    this.isMoving = false
    this.isFalling = false
    this.boundingBox = object.boundingBox
    // Graphics
    this.mesh = object.mesh
    this.mesh.mouseDown = () => {}
    this.mesh.mouseMove = () => {}
    // this.mesh.defaultColor = this.mesh.material.color
    this.position = this.mesh.position
    this.stepDistance = object.stepDistance
    this.position.set = (x, y, z) => {
      this.position.x = x
      this.position.y = y
      this.position.z = z
    }
  }

  get height () {
    return this.boundingBox.max.y
  }

  get width () {
    return this.boundingBox.max.x
  }

  move (direction, callback) {
    this.isMoving = true
    this.previousPosition = {x: this.position.x, y: this.position.y, z: this.position.z}
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        switch (direction) {
          case 'right':
            this.position.x += this.stepDistance / 3 * 0.05
            break
          case 'left':
            this.position.x -= this.stepDistance / 3 * 0.05
            break
          case 'forward':
            this.position.z -= this.stepDistance / 3 * 0.05
            break
          case 'backward':
            this.position.z += this.stepDistance / 3 * 0.05
            break
        }
      }, 1 * i)
    }
    setTimeout(() => {
      this.isMoving = false
      callback()
    }, 70)
  }
}

export default LiveObject
