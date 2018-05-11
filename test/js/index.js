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
    let block = monolith.createBlock(0xff4433)
    monolith.placeObject(block, x, y, 2)
  }
}

let player = monolith.createBlock(0x44ff33)
player.mouseDown = () => {
  player.body.position.y += 10
}

monolith.attachCamera(player)
monolith.placeObject(player, 0, 12, 2)
monolith.letAllFloatingObjectsFall()

monolith.loadObject('https://api.myjson.com/bins/1ewmje', -12, 14, -12)
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
