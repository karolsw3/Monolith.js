class Utils {
  getObjectsFixedPosition (objectPosition, grid) {
    let objectX = -Math.round(objectPosition.x / grid.width)
    let objectY = Math.ceil(objectPosition.y / grid.height)
    let objectZ = -Math.round(objectPosition.z / grid.depth)
    return {
      x: objectX,
      y: objectY,
      z: objectZ
    }
  }
}

export default Utils
