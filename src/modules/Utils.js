class Utils {
  getObjectsFixedPosition (object) {
    let objectX = -Math.round(object.position.x / object.mesh.geometry.parameters.width)
    let objectY = Math.ceil(object.position.y / object.mesh.geometry.parameters.height)
    let objectZ = -Math.round(object.position.z / object.mesh.geometry.parameters.depth)
    return {
      x: objectX,
      y: objectY,
      z: objectZ
    }
  }
}

export default Utils
