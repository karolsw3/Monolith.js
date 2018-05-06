import Utils from './Utils.js'

class RetardedPhysicsEngine {
  constructor (settings) {
    this.utils = new Utils()
    this.grid = settings.grid
    this.gravity = settings.gravity
    this.sizeX = settings.sizeX
    this.sizeY = settings.sizeY
    this.sizeZ = settings.sizeZ
    this.objectsMatrix = this._create3DMatrix(this.sizeX, this.sizeY, this.sizeZ)
    this.objectsWhichShouldFall = []
  }

  addObject (object) {
    let position = this.utils.getObjectsFixedPosition(object.position, this.grid)
    this.objectsMatrix[position.x][position.y][position.z] = object
  }

  checkAllObjectsIfTheyShouldFall () {
    for (let x = 0; x < this.sizeX; x++) {
      for (let z = 0; z < this.sizeZ; z++) {
        this.checkIfColumnShouldFall(x, z)
      }
    }
  }

  checkIfColumnShouldFall (x, z) {
    let groundPosition = 0
    for (let y = 0; y < this.sizeY; y++) {
      let object = this.objectsMatrix[x][y][z]
      if (y > 0 && this.objectsMatrix[x][y][z] !== 0 && this.objectsMatrix[x][y - 1][z] === 0) {
        object.distanceAboveGround = y - groundPosition
        object.previousPosition = {x, y, z}
        this.objectsWhichShouldFall.push(object)
        break
      } else if (this.objectsMatrix[x][y][z] !== 0) {
        groundPosition++
      }
    }
  }

  makeObjectsFall () {
    for (let i = 0; i < this.objectsWhichShouldFall.length; i++) {
      let object = this.objectsWhichShouldFall[i]
      let distanceValues = this._calculateDistanceValues(object.distanceAboveGround)
      object.previousPosition = Object.assign({}, object.position)
      for (let repetitions = 0; repetitions < distanceValues.length; repetitions++) {
        setTimeout(() => {
          object.position.y -= distanceValues[repetitions]
        }, repetitions * this.gravity)
      }

      setTimeout(() => {
        object.position.y = Math.round(object.position.y)
        let actualPosition = this.utils.getObjectsFixedPosition(object.position, this.grid)
        let previousPosition = this.utils.getObjectsFixedPosition(object.previousPosition, this.grid)
        this.objectsMatrix[actualPosition.x][actualPosition.y][actualPosition.z] = Object.assign({}, object)
        this.objectsMatrix[previousPosition.x][previousPosition.y][previousPosition.z] = 0
      }, distanceValues.length * this.gravity)
    }

    this.objectsWhichShouldFall = []
  }

  _calculateDistanceValues (maxDistance) {
    let values = []
    for (let i = 1; i < 15; i++) {
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
