var monolith = new Monolith({
  backgroundColor: 'rgb(35, 136, 219)',
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

for (let x = 0; x < 8; x++) {
  for (let z = 0; z < 8; z++) {
    monolith.placeObject(monolith.createBlock(0x443355), x, 0, z)
    for (let i = 5; i < Math.round(Math.random() * 4 + 8); i++) {
      if (Math.round(Math.random() * 3) === 1) {
        monolith.placeObject(monolith.createBlock(0xff8749), x, i, z)
      }
    }
  }
}

let player = monolith.createBlock(0x44ff33)
player.mouseDown = () => {
  player.body.position.y += 10
}

monolith.attachCamera(player)
monolith.placeObject(player, 5, 12, 5)

monolith.loadObject('https://api.myjson.com/bins/1ewmje', -12, 14, -12)
monolith.letAllFloatingObjectsFall()
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
