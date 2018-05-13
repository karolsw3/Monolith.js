import Utils from './Utils.js'

class RetardedPhysicsEngine {
  constructor (settings) {
    this.utils = new Utils()
    this.grid = settings.grid
    this.sizeX = settings.sizeX
    this.sizeY = settings.sizeY
    this.sizeZ = settings.sizeZ
    this.objectsAreAlreadyFalling = false
    this.objectsMatrix = this._create3DMatrix(this.sizeX, this.sizeY, this.sizeZ)
    this.objectsWhichShouldFall = []
  }

  addObject (object) {
    let position = this.utils.getObjectsFixedPosition(object.position, this.grid)
    this.objectsMatrix[position.x][position.y][position.z] = object
  }

  checkCollision (object, direction) {
    let position = this.utils.getObjectsFixedPosition(object.position, this.grid)
    switch (direction) {
      case 'top':
        return (this.objectsMatrix[position.x][position.y + 1][position.z] !== 0)
      case 'bottom':
        return (this.objectsMatrix[position.x][position.y - 1][position.z] !== 0)
      case 'left':
        return (this.objectsMatrix[position.x + 1][position.y][position.z] !== 0)
      case 'right':
        return (this.objectsMatrix[position.x - 1][position.y][position.z] !== 0)
      case 'forward':
        return (this.objectsMatrix[position.x][position.y][position.z + 1] !== 0)
      case 'backward':
        return (this.objectsMatrix[position.x][position.y][position.z - 1] !== 0)
    }
  }

  checkAllObjectsIfTheyShouldFall () {
    this.objectsWhichShouldFall = []
    for (let x = 0; x < this.sizeX; x++) {
      for (let z = 0; z < this.sizeZ; z++) {
        this.checkIfColumnShouldFall(x, z)
      }
    }
  }

  checkIfColumnShouldFall (x, z) {
    let groundPosition = 0
    let isTheColumnFloating = false
    for (let y = 0; y < this.sizeY; y++) {
      let object = this.objectsMatrix[x][y][z]
      if (y > 0 && object !== 0 && (this.objectsMatrix[x][y - 1][z] === 0 || isTheColumnFloating) && !object.isFalling) {
        object.distanceAboveGround = y - groundPosition
        object.groundPosition = groundPosition
        object.previousPosition = {x, y, z}
        this.objectsWhichShouldFall.push(object)
        isTheColumnFloating = true
      }
      if (object !== 0) {
        groundPosition++
      }
    }
  }

  makeObjectsFall () {
    this.objectsAreAlreadyFalling = true
    for (let i = 0; i < this.objectsWhichShouldFall.length; i++) {
      let object = this.objectsWhichShouldFall[i]

      object.previousPosition = Object.assign({}, object.position)
      object.isFalling = true
      for (let repetitions = 0; repetitions < 100; repetitions++) {
        setTimeout(() => {
          object.position.y = object.groundPosition * this.grid.height + object.distanceAboveGround - this._easeOutCubic(repetitions / 100) * object.distanceAboveGround
          object.boxHelper.update()
        }, repetitions * object.distanceAboveGround)
      }

      setTimeout(() => {
        object.position.y = Math.round(object.position.y)
        let actualPosition = this.utils.getObjectsFixedPosition(object.position, this.grid)
        let previousPosition = this.utils.getObjectsFixedPosition(object.previousPosition, this.grid)
        this.objectsMatrix[actualPosition.x][actualPosition.y][actualPosition.z] = object
        this.objectsMatrix[previousPosition.x][previousPosition.y][previousPosition.z] = 0
      }, 100 * object.distanceAboveGround)

      setTimeout(() => {
        object.isFalling = false
      }, 110 * object.distanceAboveGround)
    }

    this.objectsWhichShouldFall = []
  }

  _easeOutCubic (t) {
    return Math.pow(t, 2)
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
