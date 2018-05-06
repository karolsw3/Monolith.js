class LiveObject {
  constructor (object) {
    this.inMove = false
    this.horizontalCollision = false

    // Graphics
    this.mesh = new THREE.Mesh(object.geometry, object.material)
    this.mesh.mouseDown = () => {}
    this.mesh.defaultColor = this.mesh.material.color
    this.position = {x: 0, y: 0, z: 0}
    this.position.set = (x, y, z) => {
      this.position.x = x
      this.position.y = y
      this.position.z = z
    }
  }

  move (direction) {
    if (!this.body.inMove) {
      this.body.inMove = true
      this.body.position.y += this.height * 0.3
      this.body.previousPosition = {x: this.body.position.x, y: this.body.position.y, z: this.body.position.z}
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          if (!this.horizontalCollision) {
            switch (direction) {
              case 'right':
                this.body.position.x += this.width / 3 * 0.048
                break
              case 'left':
                this.body.position.x -= this.width / 3 * 0.048
                break
              case 'forward':
                this.body.position.z -= this.width / 3 * 0.048
                break
              case 'backward':
                this.body.position.z += this.width / 3 * 0.048
                break
            }
          } else {
            this.body.position.set(this.body.previousPosition.x, this.body.previousPosition.y, this.body.previousPosition.z)
          }
        }, 1 * i)

        setTimeout(() => {
          this.body.velocity.y = 0
        }, 110)

        setTimeout(() => {
          if (this.horizontalCollision) {
            this.body.position.set(this.body.previousPosition.x, this.body.previousPosition.y, this.body.previousPosition.z)
          }
          this.body.position.x = Math.round(this.body.position.x)
          this.body.velocity.x = 0
          this.body.velocity.z = 0
          this.body.position.z = Math.round(this.body.position.z)
        }, 81)

        setTimeout(() => {
          this.body.inMove = false
          this.horizontalCollision = false
        }, 100)
      }
    }
  }
}

export default LiveObject
