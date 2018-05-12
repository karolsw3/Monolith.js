var monolith = new Monolith({
  backgroundColor: 'rgb(3, 106, 191)',
  renderDistance: 4,
  gravity: true,
  sizeX: 100,
  sizeY: 100,
  sizeZ: 100,
  grid: {
    width: 3,
    height: 1,
    depth: 3,
    visible: true
  }
})

monolith.init()

for (let x = 0; x < 10; x++) {
  for (let y = x; y < 10; y++) {
    for (let z = 2; z < 10; z++) {
      let block = monolith.createBlock(0xff4433)
      monolith.placeObject(block, x, y, z)
    }
  }
}

let player = monolith.createBlock(0x44ff33)
player.mouseDown = () => {
  player.body.position.y += 10
}

monolith.attachCamera(player)
monolith.placeObject(player, 0, 12, 2)
monolith.letAllFloatingObjectsFall()

monolith.loadMeshes([{url: 'https://api.myjson.com/bins/1ewmje', name: 'tree'}])

monolith.onMeshesLoad = () => {
  monolith.placeObject(monolith.createObjectFromMesh(monolith.loadedMeshes['tree']), 0, 17, 0)
  monolith.placeObject(monolith.createObjectFromMesh(monolith.loadedMeshes['tree']), 4, 17, 3)
  monolith.placeObject(monolith.createObjectFromMesh(monolith.loadedMeshes['tree']), 4, 17, 5)
}

window.addEventListener('keydown', (event) => {
  var keyCode = event.keyCode
  switch (keyCode) {
    case 68: // d
      monolith.moveObject(player, 'right')
      break
    case 69: // e
      monolith.moveObject(player, 'forward')
      break
    case 65: // a
      monolith.moveObject(player, 'backward')
      break
    case 81: // q
      monolith.moveObject(player, 'left')
      break
  }
}, false)
