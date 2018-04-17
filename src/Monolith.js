class Monolith {
  constructor (settings) {
    this.settings = settings
    this.space = this._create3DArray(settings.sizeX, settings.sizeY, settings.sizeZ)
  }

  _create3DArray (sizeX, sizeY, sizeZ) {
    let array = []
    for (let x = 0; x < sizeX; x++) {
      array[x] = []
      for (let y = 0; y < sizeY; y++) {
        array[x][y] = []
        for (let z = 0; z < sizeZ; z++) {
          array[x][y][z] = 0
        }
      }
    }
    return array
  }
}

export default Monolith
