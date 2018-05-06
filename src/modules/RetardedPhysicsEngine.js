class RetardedPhysicsEngine {
  constructor (settings) {
    this.gravity = settings.gravity
    this.sizeX = settings.sizeX
    this.sizeY = settings.sizeY
    this.sizeZ = settings.sizeZ
    this.objectsMatrix = this._create3DMatrix(this.sizeX, this.sizeY, this.sizeZ)
    this.objectsWhichShouldFall = []
  }

  addObject (object) {
    let position = this._getObjectsFixedPosition(object)
    this.objectsMatrix[position.x][position.y][position.z] = object
  }

  _getObjectsFixedPosition (object) {
    let objectX = -Math.round(object.position.x / object.mesh.geometry.parameters.width)
    let objectY = Math.ceil(object.position.y / object.mesh.geometry.parameters.height)
    let objectZ = -Math.round(object.position.z / object.mesh.geometry.parameters.depth)
    return {
      x: objectX,
      y: objectY,
      z: objectZ
    }
  }

  checkAllObjectsIfTheyShouldFall () {
    for (let x = 0; x < this.sizeX; x++) {
      for (let z = 0; this.sizeZ; z++) {
        this.checkIfColumnShouldFall(x, z)
      }
    }
  }

  checkIfColumnShouldFall (x, z) {
    for (let y = 1; y < this.sizeY; y++) {
      let object = this.objectsMatrix[x][y][z]
      if (this.objectsMatrix[x][y - 1][z] === 0) {
        object.distanceAboveGround = y
        object.previousPosition = {x, y, z}
        this.objectsWhichShouldFall.push(object)
        break
      }
    }
  }

  makeObjectsFall () {
    for (let i = 0; i < this.objectsWhichShouldFall.length; i++) {
      let object = this.objectsWhichShouldFall[i]
      let distanceValues = this._calculateDistanceValues()
      for (let repetitions = 0; repetitions < object.distanceAboveGround; repetitions++) {
        setTimeout(() => {
          object.position.y -= distanceValues[repetitions]
        }, repetitions * this.gravity)
      }

      setTimeout(() => {
        object.position.y = Math.round(object.position.y)
        this.objectsMatrix[object.position.x][object.position.y][object.position.z] = object // Consider Object.assign({}, object)
        this.objectsMatrix[object.previousPosition.x][object.previousPosition.y][object.previousPosition.z] = 0
      }, object.distanceAboveGround * this.gravity)
      object.velocity += this.gravity
    }
  }

  _calculateDistanceValues (startY, endY) {
    let maxDistance = endY - startY
    let values = []
    for (let i = 0; i < 20; i++) {
      values.push(maxDistance / Math.pow(2, i))
    }
    return values.reverse()
  }

  _create3DMatrix (maxX, maxY, maxZ) {
    let matrix = []
    for (let x = 0; x < maxX; x++) {
      matrix[x] = []
      for (let y = 0; y < maxY; y++) {
        matrix[x][y] = []
        for (let z = 0; z < maxZ; z++) {
          matrix[x][y][z] = 0
        }
      }
    }
    return matrix
  }
}

export default RetardedPhysicsEngine
